# script_generation/services/content_processor.py
from django.conf import settings
import google.generativeai as genai
from PIL import Image
import pytesseract
from ...crawler.services.article_service import ArticleService  # Import từ crawler

class ContentProcessor:
    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.article_service = ArticleService()  # Sử dụng service từ crawler
    
    def get_articles_from_crawler(self, keyword=None, limit=5):
        """Gọi sang crawler service để lấy dữ liệu"""
        return self.article_service.get_articles(keyword, limit)

    def generate_simplified_explanation(self, content, audience="children", file_paths: list[str] = None):
        """
        Use Gemini to generate a simplified and easy-to-understand explanation tailored for a specific audience.

        Args:
            content (str): Scientific content to explain
            audience (str): Target audience (default: children)
            file_paths (list[str]): List of additional file paths (.txt, .png, .jpg, .pdf, .docx)

        Returns:
            str: Simplified explanation as text
        """
        from PIL import Image
        import pytesseract
        import fitz  # PyMuPDF
        import docx

        full_content = str(content) if content else ""
        file_content = ""

        if file_paths:
            for path in file_paths:
                try:
                    if not isinstance(path, str):
                        return f"[Error] Invalid file path: {path}"

                    if path.lower().endswith(('.png', '.jpg', '.jpeg')):
                        img = Image.open(path)
                        text = pytesseract.image_to_string(img, lang='eng')
                        file_content += f"\n\n[Text extracted from image {path}]:\n{text}"

                    elif path.lower().endswith('.txt'):
                        with open(path, 'r', encoding='utf-8') as f:
                            text = f.read()
                            file_content += f"\n\n[Text from .txt file {path}]:\n{text}"

                    elif path.lower().endswith('.pdf'):
                        doc = fitz.open(path)
                        text = "".join(page.get_text() for page in doc)
                        file_content += f"\n\n[Text from PDF file {path}]:\n{text}"

                    elif path.lower().endswith('.docx'):
                        document = docx.Document(path)
                        text = "\n".join(paragraph.text for paragraph in document.paragraphs)
                        file_content += f"\n\n[Text from DOCX file {path}]:\n{text}"

                    else:
                        file_content += f"\n\n[⚠️ Skipping unsupported file: {path}]"

                except Exception as e:
                    return f"[Error processing file {path}]: {str(e)}"

            if file_content:
                full_content = f"{full_content}\n\n{file_content}" if full_content else file_content

        if not str(full_content).strip():
            return "[Error] No input content to explain."

        prompt = f"""
    You are a science communication expert. Please explain the content below in a way that is suitable for an audience of **{audience}**.

    --- CONTENT TO EXPLAIN ---
    {full_content}

    --- REQUIREMENTS ---
    - Use clear, simple, and relatable language for {audience}
    - Avoid technical terms or abstract explanations
    - If possible, use examples, metaphors, or visual imagery to help {audience} understand more easily

    Present the explanation in the most vivid and accessible way possible.
    """

        try:
            model = genai.GenerativeModel('gemini-1.5-pro-latest')
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            return f"[AI Error] {str(e)}"

    def transform_to_story(content="", style="vivid", genre="adventure", file_paths: list[str] = None):
        """
        Convert scientific content into a story (from direct text input and file list)

        Args:
            content (str): Direct scientific content (default: empty)
            style (str): Storytelling style
            genre (str): Story genre
            file_paths (list[str]): List of file paths (image/text) with additional content

        Returns:
            str: Transformed story or error message
        """
        final_content = str(content) if content else ""
        file_content = ""

        if file_paths:
            for path in file_paths:
                try:
                    if not isinstance(path, str):
                        return f"[Error] Invalid file path: {path}"

                    if path.lower().endswith('.txt'):
                        with open(path, 'r', encoding='utf-8') as f:
                            text = f.read()
                            file_content += f"\n\n[Text from TXT file {path}]:\n{text}"

                    elif path.lower().endswith('.docx'):
                        import docx
                        doc = docx.Document(path)
                        text = "\n".join(paragraph.text for paragraph in doc.paragraphs)
                        file_content += f"\n\n[Text from DOCX file {path}]:\n{text}"

                    elif path.lower().endswith('.pdf'):
                        import fitz
                        doc = fitz.open(path)
                        text = "".join(page.get_text() for page in doc)
                        file_content += f"\n\n[Text from PDF file {path}]:\n{text}"

                    elif path.lower().endswith('.doc'):
                        file_content += f"\n\n[⚠️ Skipping unsupported .doc file: {path}]"

                except Exception as e:
                    return f"[File read error {path}] {str(e)}"

            if file_content:
                final_content = f"{final_content}\n\n{file_content}" if final_content else file_content

        if not str(final_content).strip():
            return "[Error] No scientific content provided."

        prompt = f"""
    Please turn the following scientific content into a {style} story in the {genre} genre:

    --- ORIGINAL CONTENT ---
    {final_content}

    --- REQUIREMENTS ---
    1. STORY PART (80%):
    - Characters use scientific knowledge to solve a problem
    - Include natural dialogue, avoid dry theory

    2. EXPLANATION PART (20%):
    - Use the heading "THE SCIENCE BEHIND"
    - Explain the science using metaphors or easy-to-understand comparisons
    """

        try:
            model = genai.GenerativeModel('gemini-1.5-pro-latest')
            response = model.generate_content(prompt)
            return str(response.text)
        except Exception as e:
            return f"[AI Error] {str(e)}"

