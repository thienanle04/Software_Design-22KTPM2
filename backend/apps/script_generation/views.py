from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .services.content_processor import ContentProcessor
from rest_framework.permissions import AllowAny

import os
import logging
from datetime import datetime
import requests
from django.conf import settings    

from ..crawler.utils import fetch_from_url

# Cấu hình logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('content_processor.log'),
        logging.StreamHandler()
    ]
)
class ScienceStoryView(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        keyword = request.query_params.get('keyword', None)
        style = request.query_params.get('style', 'adventure')
        
        processor = ContentProcessor()
        articles = processor.get_articles_from_crawler(keyword)
        
        if not articles:
            return Response({"error": "No articles found"}, status=status.HTTP_404_NOT_FOUND)
        
        results = []
        for article in articles:
            story = processor.transform_to_story(article.content, style)
            results.append({
                "original_title": article.title,
                "story": story,
                "source": article.url
            })
        
        return Response({"stories": results})
    def post(self, request):
        # Lấy dữ liệu từ body request
        content = request.data.get('content', None)
        style = request.data.get('style', 'adventure')
        
        if not content:
            return Response({"error": "Content is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        processor = ContentProcessor()
        
        try:
            story = processor.transform_to_story(content, style)
            return Response({
                "story": story,
            })
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class SimplifiedScienceView(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        keyword = request.query_params.get('keyword', None)
        audience = request.query_params.get('audience', 'children')
        
        processor = ContentProcessor()
        articles = processor.get_articles_from_crawler(keyword)
        
        if not articles:
            return Response({"error": "No articles found"}, status=status.HTTP_404_NOT_FOUND)
        
        results = []
        for article in articles:
            simplified = processor.generate_simplified_explanation(article.content, audience)
            results.append({
                "original_title": article.title,
                "simplified_explanation": simplified,
                "audience": audience,
                "source": article.url
            })
        
        return Response({"explanations": results})
    def post(self, request):
        # Tạo timestamp cho request
        request_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        request_id = f"REQ-{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
        
        logging.info(f"[{request_id}] Starting request at {request_time}")
        logging.info(f"[{request_id}] Request data: {request.data}")
        
        # Determine input type (text or URL)
        content = request.data.get('content')
        url = request.data.get('url')
        audience = request.data.get('audience', 'children')
        
        # Validate at least one input is provided
        if not content and not url:
            error_msg = "Either content or URL is required"
            logging.error(f"[{request_id}] Validation error: {error_msg}")
            return Response(
                {"error": error_msg, "request_id": request_id}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        processor = ContentProcessor()
        file_paths = []
        
        try:
            # Handle file uploads if present
            if 'files' in request.FILES:
                logging.info(f"[{request_id}] Processing {len(request.FILES.getlist('files'))} file(s)")
                
                for file in request.FILES.getlist('files'):
                    try:
                        file_path = os.path.join(settings.MEDIA_ROOT, 'temp', file.name)
                        os.makedirs(os.path.dirname(file_path), exist_ok=True)
                        
                        logging.info(f"[{request_id}] Saving file: {file.name} to {file_path}")
                        
                        with open(file_path, 'wb+') as destination:
                            for chunk in file.chunks():
                                destination.write(chunk)
                        file_paths.append(file_path)
                        
                        logging.info(f"[{request_id}] Successfully saved file: {file.name}")
                        
                    except Exception as file_error:
                        logging.error(f"[{request_id}] Error saving file {file.name}: {str(file_error)}")
                        raise ValueError(f"File processing error: {str(file_error)}")
            
            # Process URL input
            if url:
                logging.info(f"[{request_id}] Fetching content from URL: {url}")
                try:
                    url_content = fetch_from_url(url)
                    if not url_content or not url_content.get('content'):
                        raise ValueError("Could not extract meaningful content from URL")
                        
                    content = url_content['content']
                    logging.info(f"[{request_id}] Successfully fetched URL content. Length: {len(content)} chars")
                    
                except Exception as e:
                    error_msg = f"Failed to process URL: {str(e)}"
                    logging.error(f"[{request_id}] {error_msg}")
                    return Response(
                        {"error": error_msg, "request_id": request_id},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            logging.info(f"[{request_id}] Generating explanation for audience: {audience}")
            
            # Generate simplified explanation
            simplified = processor.generate_simplified_explanation(
                content=content,
                audience=audience,
                file_paths=file_paths if file_paths else None
            )
            
            logging.info(f"[{request_id}] Successfully generated explanation. Length: {len(simplified)} chars")
            
            # Clean up temporary files
            for file_path in file_paths:
                try:
                    os.remove(file_path)
                    logging.info(f"[{request_id}] Cleaned up file: {file_path}")
                except OSError as e:
                    logging.warning(f"[{request_id}] Error cleaning up file {file_path}: {str(e)}")
            
            return Response({
                "simplified_explanation": simplified,
                "request_id": request_id
            })
            
        except Exception as e:
            logging.error(f"[{request_id}] Processing error: {str(e)}", exc_info=True)
            
            # Clean up files if error occurs
            for file_path in file_paths:
                try:
                    os.remove(file_path)
                    logging.info(f"[{request_id}] Cleaned up file after error: {file_path}")
                except (OSError, UnboundLocalError) as cleanup_error:
                    logging.warning(f"[{request_id}] Error during cleanup: {str(cleanup_error)}")
                    
            return Response(
                {
                    "error": str(e),
                    "request_id": request_id,
                    "details": "Check logs for more information"
                }, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    