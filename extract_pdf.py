#!/usr/bin/env python3
"""Extract text from PDF focusing on Member 3 requirements"""

try:
    import PyPDF2
    pdf_available = True
except ImportError:
    pdf_available = False
    print("PyPDF2 not available, trying pdfplumber...")
    
try:
    import pdfplumber
    plumber_available = True
except ImportError:
    plumber_available = False
    print("pdfplumber not available either")

import sys
import re

pdf_path = r"D:\Assignment\it3030-paf-2026-smart-campus-groupXX\docs\PAF_Assignment-2026.pdf"

def extract_with_pypdf2(pdf_path):
    """Extract text using PyPDF2"""
    text = []
    with open(pdf_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        print(f"Total pages: {len(reader.pages)}")
        for i, page in enumerate(reader.pages):
            page_text = page.extract_text()
            text.append(f"\n--- PAGE {i+1} ---\n")
            text.append(page_text)
    return '\n'.join(text)

def extract_with_pdfplumber(pdf_path):
    """Extract text using pdfplumber"""
    text = []
    with pdfplumber.open(pdf_path) as pdf:
        print(f"Total pages: {len(pdf.pages)}")
        for i, page in enumerate(pdf.pages):
            page_text = page.extract_text()
            text.append(f"\n--- PAGE {i+1} ---\n")
            text.append(page_text)
    return '\n'.join(text)

def find_member3_sections(text):
    """Find sections related to Member 3"""
    lines = text.split('\n')
    member3_sections = []
    capture = False
    section_buffer = []
    
    for i, line in enumerate(lines):
        # Look for Member 3, Maintenance, Ticket keywords
        if re.search(r'member\s*3|maintenance|ticket|issue\s*report', line, re.IGNORECASE):
            capture = True
            section_buffer = [line]
        elif capture:
            section_buffer.append(line)
            # Stop capturing after a reasonable amount of context
            if len(section_buffer) > 50:
                member3_sections.append('\n'.join(section_buffer))
                capture = False
                section_buffer = []
    
    if section_buffer:
        member3_sections.append('\n'.join(section_buffer))
    
    return member3_sections

if __name__ == "__main__":
    try:
        if pdf_available:
            print("Using PyPDF2...")
            full_text = extract_with_pypdf2(pdf_path)
        elif plumber_available:
            print("Using pdfplumber...")
            full_text = extract_with_pdfplumber(pdf_path)
        else:
            print("ERROR: No PDF extraction library available!")
            print("Please install: pip install PyPDF2 or pip install pdfplumber")
            sys.exit(1)
        
        # Find Member 3 sections
        sections = find_member3_sections(full_text)
        
        if sections:
            print(f"\n\nFound {len(sections)} Member 3 related sections:\n")
            for i, section in enumerate(sections):
                print(f"\n{'='*80}")
                print(f"SECTION {i+1}")
                print('='*80)
                print(section)
        else:
            print("\n\nNo Member 3 specific sections found. Showing full text:")
            print(full_text[:10000])  # First 10k chars
            
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
