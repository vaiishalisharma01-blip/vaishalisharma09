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
            # Truncate left if needed for one-line fit
            while self.get_string_width(left) > left_w - 2 and len(left) > 20:
                left = left[:-4] + "..."
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

    pdf.set_font("Helvetica", "B", 18)
    pdf.cell(0, 7.5, "VAISHALI SHARMA", align="C", new_x="LMARGIN", new_y="NEXT")

    pdf.set_font("Helvetica", "B", 10.5)
    pdf.cell(0, 4.5, "Frontend Developer | React.js | JavaScript", align="C", new_x="LMARGIN", new_y="NEXT")

    pdf.set_font("Helvetica", "", 9.5)
    pdf.cell(
        0,
        4.0,
        "Kanpur, UP, India  |  +91 7905987701  |  vaiishali.sharma.01@gmail.com",
        align="C",
        new_x="LMARGIN",
        new_y="NEXT",
    )
    pdf.cell(
        0,
        4.0,
        "LinkedIn: linkedin.com/in/vaishali-sharma-3611b332a  |  Portfolio: ibuilt-thisapp.vercel.app",
        align="C",
        new_x="LMARGIN",
        new_y="NEXT",
    )
    pdf.ln(2)

    pdf.section_title("Professional Summary")
    pdf.body(
        "Fresher Frontend Developer skilled in building responsive, mobile-first web apps with "
        "React.js, JavaScript, and Tailwind CSS. Comfortable turning designs into clean UI "
        "components, connecting APIs, and shipping production builds. Brings internship "
        "experience in AI evaluation plus full-stack project work - ready to contribute to a "
        "product team and grow as a Frontend Engineer."
    )

    pdf.section_title("Technical Skills")
    pdf.labeled_line(
        "Frontend",
        "React.js, JavaScript (ES6+), HTML5, CSS3, Tailwind CSS, Responsive Design, Figma",
    )
    pdf.labeled_line("Backend & APIs", "Flask, Django, REST APIs, Node.js (Basics), SQLite")
    pdf.labeled_line("Languages", "Python, C, Java")
    pdf.labeled_line("Tools", "Git, GitHub, VS Code, Vercel, PyTorch")
    pdf.ln(1)

    pdf.section_title("Education")
    pdf.entry_header("B.Tech, Computer Science & Engineering", "09/2022 - Present")
    pdf.italic_line("Kanpur Institute of Technology, Kanpur, UP")
    pdf.ln(1)
    pdf.entry_header("Class XII (Computer Science)", "04/2021 - 04/2022")
    pdf.italic_line("Kendriya Vidyalaya No.1, Kanpur, UP")
    pdf.ln(1)

    pdf.section_title("Internship Experience")
    pdf.entry_header(
        "LLM Post-Training Intern | Ethara.AI | Remote",
        "01/2026 - 05/2026",
    )
    pdf.bullet(
        "Improved model response quality by applying SFT and RLHF techniques focused on "
        "accuracy, safety, and human preference alignment."
    )
    pdf.bullet(
        "Prepared and filtered training datasets so alignment pipelines used cleaner, more "
        "reliable examples."
    )
    pdf.bullet(
        "Tested model outputs for hallucinations and weak prompts, then iterated with the "
        "research team to tighten prompt logic."
    )
    pdf.ln(1)

    pdf.section_title("Projects")
    pdf.entry_header("Crop-Sense - AI Farming Assistant (Full-Stack)")
    pdf.bullet(
        "Designed a practical AI tool that helps farmers pick crops from soil data, track "
        "fertilizer gaps, spot leaf disease, and ask farming questions in a chatbot."
    )
    pdf.bullet(
        "Shipped a Flask backend with a Random Forest crop model and ResNet9 CNN for leaf "
        "analysis; connected DeepSeek R1 for chat and kept local inference under 2 seconds "
        "with in-memory model caching."
    )
    pdf.ln(1)
    pdf.entry_header("iBuilt-This - React Portfolio Web App", "ibuilt-thisapp.vercel.app")
    pdf.bullet(
        "Built a fast, reusable React + Tailwind UI with smooth client-side routing and "
        "layouts that stay consistent on mobile and desktop."
    )
    pdf.bullet(
        "Deployed to Vercel with production asset optimization so first load stays quick "
        "across devices."
    )
    pdf.ln(1)

    pdf.section_title("Certifications")
    pdf.entry_header(
        "Cybersecurity - Advanced IT Skills (Grade A) | ICT Academy & Redington (Cisco)",
        "11/2025 - 12/2025",
    )
    pdf.entry_header("Django Web Development | RCPL", "06/2025 - 07/2025")
    pdf.entry_header(
        "Python Programming Internship | Oasis Infobyte",
        "08/2025",
    )

    out = "/workspace/resume/Vaishali_Sharma_ATS_Resume.pdf"
    pdf.output(out)
    print(f"Wrote {out} ({pdf.page_no()} page(s))")


if __name__ == "__main__":
    build()
