#!/usr/bin/env python3
"""Generate a one-page ATS-friendly PDF resume for Vaishali Sharma."""

from fpdf import FPDF


class ResumePDF(FPDF):
    def section_title(self, title: str) -> None:
        self.set_font("Helvetica", "B", 11)
        self.set_x(self.l_margin)
        self.cell(0, 6, title.upper(), new_x="LMARGIN", new_y="NEXT")
        y = self.get_y()
        self.set_draw_color(0, 0, 0)
        self.set_line_width(0.3)
        self.line(self.l_margin, y, self.w - self.r_margin, y)
        self.ln(2)

    def body(self, text: str) -> None:
        self.set_font("Helvetica", "", 10)
        self.multi_cell(0, 4.4, text)
        self.ln(1)

    def labeled_line(self, label: str, value: str) -> None:
        self.set_font("Helvetica", "B", 10)
        self.write(4.4, f"{label}: ")
        self.set_font("Helvetica", "", 10)
        self.write(4.4, value)
        self.ln(4.8)

    def entry_header(self, left: str, right: str = "") -> None:
        self.set_font("Helvetica", "B", 10)
        usable = self.w - self.l_margin - self.r_margin
        if right:
            right_w = self.get_string_width(right) + 1
            left_w = usable - right_w
            self.cell(left_w, 4.6, left)
            self.set_font("Helvetica", "", 10)
            self.cell(right_w, 4.6, right, align="R", new_x="LMARGIN", new_y="NEXT")
        else:
            self.multi_cell(0, 4.6, left)

    def italic_line(self, text: str) -> None:
        self.set_font("Helvetica", "I", 9.5)
        self.cell(0, 4.2, text, new_x="LMARGIN", new_y="NEXT")

    def bullet(self, text: str) -> None:
        self.set_font("Helvetica", "", 9.5)
        x = self.l_margin
        self.set_x(x)
        bullet_w = 4
        self.cell(bullet_w, 4.2, "-")
        self.multi_cell(self.w - self.r_margin - x - bullet_w, 4.2, text)


def build() -> None:
    pdf = ResumePDF(format="Letter")
    pdf.set_auto_page_break(auto=False)
    pdf.set_margins(15, 12, 15)
    pdf.add_page()

    # Name
    pdf.set_font("Helvetica", "B", 18)
    pdf.cell(0, 8, "VAISHALI SHARMA", align="C", new_x="LMARGIN", new_y="NEXT")

    # Contact
    pdf.set_font("Helvetica", "", 9.5)
    pdf.cell(
        0,
        4.2,
        "Kanpur, UP, India  |  +91 7905987701  |  vaiishali.sharma.01@gmail.com",
        align="C",
        new_x="LMARGIN",
        new_y="NEXT",
    )
    pdf.cell(
        0,
        4.2,
        "LinkedIn: linkedin.com/in/vaishali-sharma-3611b332a",
        align="C",
        new_x="LMARGIN",
        new_y="NEXT",
    )
    pdf.ln(2)

    # Summary
    pdf.section_title("Professional Summary")
    pdf.body(
        "Computer Science Engineering graduate and aspiring Frontend Developer with hands-on "
        "experience building clean, responsive, and performance-optimized web applications "
        "using React.js, JavaScript, HTML5, CSS3, and Tailwind CSS. Strong foundation in API "
        "integration, UI/UX design, and translating data into intuitive user interfaces. "
        "Seeking a full-time Frontend Developer role to apply internship experience and modern "
        "web development skills."
    )

    # Skills
    pdf.section_title("Technical Skills")
    pdf.labeled_line(
        "Frontend",
        "React.js, JavaScript, HTML5, CSS3, Tailwind CSS, UI/UX Design, Figma",
    )
    pdf.labeled_line("Languages", "Python, C, Java")
    pdf.labeled_line("Backend & Frameworks", "Flask, Django, Node.js (Basics), PyTorch")
    pdf.labeled_line("Tools & Databases", "GitHub, Git, VS Code, SQLite, Vercel")
    pdf.ln(1)

    # Education
    pdf.section_title("Education")
    pdf.entry_header(
        "Bachelor of Technology in Computer Science & Engineering",
        "09/2022 - Present",
    )
    pdf.italic_line("Kanpur Institute of Technology, Kanpur, UP")
    pdf.ln(1)
    pdf.entry_header(
        "Higher Secondary (Class XII) - Computer Science",
        "04/2021 - 04/2022",
    )
    pdf.italic_line("Kendriya Vidyalaya No.1, Kanpur, UP")
    pdf.ln(1)

    # Experience
    pdf.section_title("Experience")
    pdf.entry_header(
        "LLM Post-Training Intern | Ethara.AI | Remote",
        "01/2026 - 05/2026",
    )
    pdf.bullet(
        "Optimized LLM response accuracy, safety, and human alignment metrics using "
        "Supervised Fine-Tuning (SFT) and RLHF post-training strategies."
    )
    pdf.bullet(
        "Evaluated, curated, and preprocessed high-quality datasets for model alignment pipelines."
    )
    pdf.bullet(
        "Benchmarked model outputs, identified hallucinations, and refined prompt engineering "
        "logic with AI research teams."
    )
    pdf.ln(1)

    # Projects
    pdf.section_title("Projects")
    pdf.entry_header("Crop-Sense: Intelligent AI Full-Stack Agricultural Assistant")
    pdf.bullet(
        "Built an end-to-end AI platform for crop recommendations from soil profiles, "
        "N-P-K fertilizer tracking, leaf disease detection, and a farming chatbot."
    )
    pdf.bullet(
        "Developed with Python and Flask using a Random Forest Classifier (100 trees) and a "
        "9-layer ResNet9 CNN; integrated DeepSeek R1 via OpenRouter API with sub-2-second "
        "local inference."
    )
    pdf.ln(1)
    pdf.entry_header("iBuilt-This App | ibuilt-thisapp.vercel.app")
    pdf.bullet(
        "Built a high-performance, component-driven web app with React.js, JavaScript, and "
        "Tailwind CSS focused on fast loads and mobile-first UI."
    )
    pdf.bullet(
        "Implemented client-side routing and adaptive layouts; deployed a production build to "
        "Vercel with asset optimization."
    )
    pdf.ln(1)

    # Certifications
    pdf.section_title("Certifications")
    pdf.entry_header(
        "Advanced IT Skills Training in Cybersecurity (Grade A) | ICT Academy & Redington (Cisco Academy)",
        "11/2025 - 12/2025",
    )
    pdf.entry_header(
        "Django Web Development Certification | RCPL Trainee",
        "06/2025 - 07/2025",
    )
    pdf.entry_header(
        "Python Programming Internship Certificate | Oasis Infobyte",
        "08/2025",
    )

    out = "/workspace/resume/Vaishali_Sharma_ATS_Resume.pdf"
    pdf.output(out)
    print(f"Wrote {out} ({pdf.page_no()} page(s))")


if __name__ == "__main__":
    build()
