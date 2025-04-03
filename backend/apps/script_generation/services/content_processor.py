# script_generation/services/content_processor.py
from django.conf import settings
import google.generativeai as genai
from ...crawler.services.article_service import ArticleService  # Import từ crawler

class ContentProcessor:
    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.article_service = ArticleService()  # Sử dụng service từ crawler
    
    def get_articles_from_crawler(self, keyword=None, limit=5):
        """Gọi sang crawler service để lấy dữ liệu"""
        return self.article_service.get_articles(keyword, limit)

    def generate_simplified_explanation(self, content, audience="children"):
        """Dùng Gemini để tạo giải thích đơn giản"""
        prompt = f"Giải thích khái niệm khoa học này cho {audience}:\n\n{content}\n\nHãy làm cho nó dễ hiểu, sử dụng ngôn ngữ phù hợp với {audience}."
        
        model = genai.GenerativeModel('gemini-1.5-pro-latest')
        response = model.generate_content(prompt)
        
        return response.text  # Trả về văn bản kết quả

    def transform_to_story(content="", style="sinh động", genre="phiêu lưu", file_path=None):
        """
        Biến nội dung khoa học thành truyện (nhận input từ cả text trực tiếp và file)
        
        Args:
            content (str): Nội dung khoa học trực tiếp (mặc định: rỗng)
            style (str): Phong cách viết truyện
            genre (str): Thể loại truyện
            file_path (str): Đường dẫn file (image/text) chứa nội dung bổ sung
        
        Returns:
            str: Câu chuyện đã được chuyển thể hoặc thông báo lỗi
        """
        # Đảm bảo content ban đầu là chuỗi
        final_content = str(content) if content else ""
        
        # Xử lý file nếu có
        if file_path:
            file_content = ""
            try:
                if isinstance(file_path, str):  # Kiểm tra có phải chuỗi không
                    if file_path.lower().endswith(('.png', '.jpg', '.jpeg')):
                        img = Image.open(file_path)
                        file_content = pytesseract.image_to_string(img, lang='vie')
                    elif file_path.lower().endswith(('.txt', '.doc', '.docx', '.pdf')):
                        with open(file_path, 'r', encoding='utf-8') as f:
                            file_content = f.read()
                    else:
                        return "[Lỗi] Định dạng file không hỗ trợ (.png/.jpg/.txt/.doc/.pdf)"
                    
                    # Kết hợp nội dung và đảm bảo là chuỗi
                    file_content = str(file_content)
                    final_content = f"{final_content}\n\nNội dung từ file:\n{file_content}" if final_content else file_content
                else:
                    return "[Lỗi] Đường dẫn file phải là chuỗi"
                
            except Exception as e:
                return f"[Lỗi đọc file] {str(e)}"
        
        # Kiểm tra nội dung cuối cùng (sau khi đã đảm bảo là chuỗi)
        if not str(final_content).strip():
            return "[Lỗi] Không có nội dung khoa học đầu vào"

        # Tạo prompt
        prompt = f"""
    Hãy biến nội dung khoa học sau thành một câu chuyện {style} thuộc thể loại {genre}:

    --- NỘI DUNG GỐC ---
    {final_content}

    --- YÊU CẦU ---
    1. PHẦN TRUYỆN (80%):
    - Nhân vật sử dụng kiến thức khoa học để giải quyết vấn đề
    - Có hội thoại tự nhiên, không diễn giải lý thuyết khô khan

    2. PHẦN GIẢI THÍCH (20%):
    - Đặt tiêu đề "BẢN CHẤT KHOA HỌC"
    - Giải thích bằng ẩn dụ/so sánh dễ hiểu
    """

        try:
            model = genai.GenerativeModel('gemini-1.5-pro-latest')
            response = model.generate_content(prompt)
            return str(response.text)  # Đảm bảo kết quả trả về là chuỗi
        except Exception as e:
            return f"[Lỗi AI] {str(e)}"