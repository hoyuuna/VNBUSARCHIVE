import sys
import re
from html.parser import HTMLParser

class CoreHTMLValidator(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tag_stack = []
        self.errors = []
        # Danh sách các thẻ tự đóng (không cần thẻ đóng </...>)
        self.void_elements = {
            'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 
            'link', 'meta', 'param', 'source', 'track', 'wbr'
        }
        self.current_tag = None
        self.block_content = ""
        self.block_start_line = 0

    def handle_starttag(self, tag, attrs):
        if tag not in self.void_elements:
            self.tag_stack.append((tag, self.getpos()))
        
        if tag in ['script', 'style']:
            self.current_tag = tag
            self.block_content = ""
            self.block_start_line = self.getpos()[0]

    def handle_endtag(self, tag):
        if tag in ['script', 'style'] and self.current_tag == tag:
            self.check_brackets(self.block_content, tag, self.block_start_line)
            self.current_tag = None

        if tag in self.void_elements:
            return
        
        if not self.tag_stack:
            self.errors.append(f"[LỖI HTML] Dòng {self.getpos()[0]}: Thẻ đóng </{tag}> bị thừa hoặc không có thẻ mở tương ứng.")
            return
        
        expected_tag, pos = self.tag_stack.pop()
        if expected_tag != tag:
            self.errors.append(f"[LỖI HTML] Dòng {self.getpos()[0]}: Sai thẻ đóng. Mở <{expected_tag}> tại dòng {pos[0]} nhưng lại đóng bằng </{tag}>.")

    def handle_data(self, data):
        if self.current_tag in ['script', 'style']:
            self.block_content += data

    def check_brackets(self, text, block_type, start_line):
        """Kiểm tra ngoặc {}, [], () trong JS và CSS"""
        # Loại bỏ các đoạn text trong ngoặc kép, nháy đơn, backtick và comment để không check nhầm
        text = re.sub(r'//.*', '', text) # Comment 1 dòng JS
        text = re.sub(r'/\*.*?\*/', '', text, flags=re.DOTALL) # Comment nhiều dòng JS/CSS
        text = re.sub(r'"(?:\\.|[^"\\])*"', '', text) # String ngoặc kép
        text = re.sub(r"'(?:\\.|[^'\\])*'", '', text) # String nháy đơn
        text = re.sub(r'`(?:\\.|[^`\\])*`', '', text) # Template literal (JS)

        stack = []
        pairs = {')': '(', '}': '{', ']': '['}
        
        lines = text.split('\n')
        for i, line in enumerate(lines):
            current_line_num = start_line + i
            for char in line:
                if char in '({[':
                    stack.append((char, current_line_num))
                elif char in ')}]':
                    if not stack:
                        self.errors.append(f"[LỖI {block_type.upper()}] Dòng ~{current_line_num}: Bị thừa dấu ngoặc đóng '{char}'.")
                    else:
                        top_char, top_line = stack.pop()
                        if pairs[char] != top_char:
                            self.errors.append(f"[LỖI {block_type.upper()}] Dòng ~{current_line_num}: Đóng sai ngoặc '{char}'. Mở ngoặc '{top_char}' tại dòng {top_line}.")
        
        for char, line in stack:
            self.errors.append(f"[LỖI {block_type.upper()}] Dòng ~{line}: Thiếu dấu ngoặc đóng cho '{char}'.")

    def finish_parsing(self):
        for tag, pos in self.tag_stack:
            self.errors.append(f"[LỖI HTML] Dòng {pos[0]}: Thẻ <{tag}> được mở nhưng quên chưa đóng.")

def main():
    file_path = "_core.html" if len(sys.argv) < 2 else sys.argv[1]
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        print(f"❌ Không tìm thấy file: {file_path}")
        return

    print(f"⏳ Đang phân tích file: {file_path}...\n")
    
    parser = CoreHTMLValidator()
    try:
        parser.feed(content)
        parser.finish_parsing()
    except Exception as e:
        print(f"❌ Lỗi nghiêm trọng khi parse file: {e}")
        return

    if not parser.errors:
        print("✅ TUYỆT VỜI! Không phát hiện lỗi Syntax HTML/JS/CSS cơ bản nào.")
    else:
        print(f"🚨 Phát hiện {len(parser.errors)} lỗi cú pháp có thể xảy ra:\n")
        for err in parser.errors:
            print(err)

if __name__ == "__main__":
    main()