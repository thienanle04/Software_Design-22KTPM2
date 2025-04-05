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
        Dùng Gemini để tạo giải thích đơn giản và dễ hiểu cho đối tượng người đọc cụ thể.

        Args:
            content (str): Nội dung khoa học cần giải thích
            audience (str): Đối tượng người đọc (mặc định: trẻ em)
            file_paths (list[str]): Danh sách đường dẫn file bổ sung (.txt, .png, .jpg, .pdf, .docx)

        Returns:
            str: Giải thích đơn giản hóa dưới dạng văn bản
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
                        return f"[Lỗi] Đường dẫn file không hợp lệ: {path}"

                    if path.lower().endswith(('.png', '.jpg', '.jpeg')):
                        img = Image.open(path)
                        text = pytesseract.image_to_string(img, lang='vie')
                        file_content += f"\n\n[Nội dung từ ảnh {path}]:\n{text}"

                    elif path.lower().endswith('.txt'):
                        with open(path, 'r', encoding='utf-8') as f:
                            text = f.read()
                            file_content += f"\n\n[Nội dung từ file .txt {path}]:\n{text}"

                    elif path.lower().endswith('.pdf'):
                        doc = fitz.open(path)
                        text = ""
                        for page in doc:
                            text += page.get_text()
                        file_content += f"\n\n[Nội dung từ PDF {path}]:\n{text}"

                    elif path.lower().endswith('.docx'):
                        doc = docx.Document(path)
                        text = "\n".join(p.text for p in doc.paragraphs)
                        file_content += f"\n\n[Nội dung từ DOCX {path}]:\n{text}"

                    else:
                        file_content += f"\n\n[⚠️ Bỏ qua file không hỗ trợ: {path}]"

                except Exception as e:
                    return f"[Lỗi khi xử lý file {path}]: {str(e)}"

            if file_content:
                full_content = f"{full_content}\n\n{file_content}" if full_content else file_content

        if not str(full_content).strip():
            return "[Lỗi] Không có nội dung đầu vào để giải thích."

        # Prompt chuyên nghiệp
        prompt = f"""
    Bạn là một chuyên gia truyền đạt kiến thức khoa học. Hãy giải thích nội dung dưới đây sao cho phù hợp với đối tượng là **{audience}**.

    --- NỘI DUNG CẦN GIẢI THÍCH ---
    {full_content}

    --- YÊU CẦU ---
    - Dùng ngôn ngữ rõ ràng, dễ hiểu, gần gũi với {audience}
    - Tránh dùng từ ngữ chuyên môn hoặc giải thích trừu tượng
    - Nếu có thể, hãy sử dụng ví dụ, ẩn dụ hoặc hình ảnh minh họa để giúp {audience} dễ hình dung

    Hãy trình bày một cách sinh động và dễ tiếp cận nhất.
    """

        try:
            model = genai.GenerativeModel('gemini-1.5-pro-latest')
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            return f"[Lỗi AI] {str(e)}"

            
            return response.text  # Trả về văn bản kết quả

    def transform_to_story(content="", style="sinh động", genre="phiêu lưu", file_paths: list[str] = None):
        """
        Biến nội dung khoa học thành truyện (nhận input từ cả text trực tiếp và danh sách file)

        Args:
            content (str): Nội dung khoa học trực tiếp (mặc định: rỗng)
            style (str): Phong cách viết truyện
            genre (str): Thể loại truyện
            file_paths (list[str]): Danh sách đường dẫn file (image/text) chứa nội dung bổ sung

        Returns:
            str: Câu chuyện đã được chuyển thể hoặc thông báo lỗi
        """
        # Đảm bảo content ban đầu là chuỗi
        final_content = str(content) if content else ""
        file_content = ""

        if file_paths:
            for path in file_paths:
                try:
                    if not isinstance(path, str):
                        return f"[Lỗi] Đường dẫn file không hợp lệ: {path}"
                    
                    if path.lower().endswith('.txt'):
                        with open(path, 'r', encoding='utf-8') as f:
                            text = f.read()
                            file_content += f"\n\n[Nội dung từ file TXT {path}]:\n{text}"

                    elif path.lower().endswith('.docx'):
                        import docx
                        doc = docx.Document(path)
                        text = "\n".join(p.text for p in doc.paragraphs)
                        file_content += f"\n\n[Nội dung từ file DOCX {path}]:\n{text}"

                    elif path.lower().endswith('.pdf'):
                        import fitz  # PyMuPDF
                        doc = fitz.open(path)
                        text = ""
                        for page in doc:
                            text += page.get_text()
                        file_content += f"\n\n[Nội dung từ PDF {path}]:\n{text}"

                    elif path.lower().endswith('.doc'):
                        # Optional: xử lý bằng textract hoặc thông báo chưa hỗ trợ
                        file_content += f"\n\n[⚠️ Bỏ qua file .doc (chưa hỗ trợ tốt): {path}]"

                except Exception as e:
                    return f"[Lỗi đọc file {path}] {str(e)}"

            # Gộp nội dung file vào final_content
            if file_content:
                final_content = f"{final_content}\n\n{file_content}" if final_content else file_content

        # Kiểm tra nội dung cuối cùng
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
            return str(response.text)
        except Exception as e:
            return f"[Lỗi AI] {str(e)}"
