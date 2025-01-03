from typing import List, Dict
import re

class Summarizer:
    def __init__(self):
        self.key_sections = [
            "abstract",
            "introduction",
            "conclusion",
            "summary",
            "results",
            "discussion"
        ]

    def extract_key_points(self, text: str) -> List[str]:
        """Extract key points from the text."""
        # Split into sentences (handling common abbreviations)
        sentences = re.split(r'(?<=[.!?])\s+(?=[A-ZÅÄÖ])', text)
        
        key_points = []
        current_section = ""
        
        for sentence in sentences:
            # Check if this sentence starts a new section
            lower_sent = sentence.lower()
            for section in self.key_sections:
                if section in lower_sent and len(sentence) < 50:
                    current_section = section
                    continue
            
            # Add important sentences to key points
            if any([
                # First sentence of sections
                current_section and len(key_points) == 0,
                # Contains key phrases
                "important" in lower_sent,
                "key" in lower_sent,
                "main" in lower_sent,
                "significant" in lower_sent,
                # Contains numbers or measurements
                re.search(r'\d+(?:\.\d+)?(?:\s*%|\s*degrees|\s*Hz|\s*kHz)', sentence),
                # Contains comparisons
                "better" in lower_sent,
                "worse" in lower_sent,
                "more" in lower_sent,
                "less" in lower_sent,
                # Contains conclusions
                "therefore" in lower_sent,
                "thus" in lower_sent,
                "conclude" in lower_sent,
                "summary" in lower_sent,
                # Swedish key phrases
                "viktig" in lower_sent,
                "betydande" in lower_sent,
                "sammanfattning" in lower_sent,
                "slutsats" in lower_sent
            ]):
                # Clean up the sentence
                clean_sentence = sentence.strip()
                if clean_sentence and len(clean_sentence) > 20:  # Avoid very short sentences
                    key_points.append(clean_sentence)
        
        return key_points

    def create_summary(self, text: str, metadata: dict) -> str:
        """Create a summary of the document."""
        summary_parts = []
        
        # Add basic metadata
        if metadata["title"] != "Unknown":
            summary_parts.append(f"Title: {metadata['title']}")
        if metadata["author"] != "Unknown":
            summary_parts.append(f"Author: {metadata['author']}")
        if metadata["creation_date"] != "Unknown":
            summary_parts.append(f"Created: {metadata['creation_date']}")
            
        # Always include page count
        summary_parts.append(f"Length: {metadata['pages']} pages")
        
        # Add any additional metadata if available
        if "subject" in metadata and metadata["subject"]:
            summary_parts.append(f"Subject: {metadata['subject']}")
        if "keywords" in metadata and metadata["keywords"]:
            summary_parts.append(f"Keywords: {metadata['keywords']}")
            
        # Create the summary text
        if summary_parts:
            return "Here's a summary of the document:\n\n" + "\n".join(summary_parts)
        else:
            return f"This document is {metadata['pages']} pages long."

# Initialize the summarizer
summarizer = Summarizer() 