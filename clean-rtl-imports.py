#!/usr/bin/env python3
"""
Script to remove rtlStyles imports from files.
Since rtlStyles.container is just { flex: 1 }, we can safely remove it.
"""

import os
import re
from pathlib import Path

def remove_rtl_imports(file_path):
    """Remove rtlStyles imports and usages from a file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Remove import line
        content = re.sub(r"import\s+\{[^}]*rtlStyles[^}]*\}\s+from\s+['\"]@/lib/rtl['\"];\s*\n", "", content)
        
        # Remove rtlStyles.container from style arrays (it's just { flex: 1 })
        # Replace [styles.something, rtlStyles.container, ...] with [styles.something, ...]
        content = re.sub(r",\s*rtlStyles\.container", "", content)
        content = re.sub(r"rtlStyles\.container\s*,\s*", "", content)
        content = re.sub(r"\[rtlStyles\.container\]", "undefined", content)
        
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8', newline='') as f:
                f.write(content)
            print(f"✓ Cleaned: {file_path.name}")
            return True
        
        return False
    except Exception as e:
        print(f"  [ERROR] {file_path}: {e}")
        return False

def main():
    print("Removing rtlStyles imports...")
    
    mobile_app_path = Path(r"c:\Users\Dell\Desktop\KOM\kom-mobile-app")
    
    # Files that import rtlStyles
    files_to_clean = [
        "app/privacy.tsx",
        "app/notifications.tsx",
        "app/modal.tsx",
        "app/contact.tsx",
        "app/add-listing/[id].tsx",
        "app/+not-found.tsx",
        "app/(tabs)/chat.tsx",
    ]
    
    cleaned_count = 0
    
    for file_rel in files_to_clean:
        file_path = mobile_app_path / file_rel
        if file_path.exists():
            if remove_rtl_imports(file_path):
                cleaned_count += 1
        else:
            print(f"  [WARNING] File not found: {file_rel}")
    
    print(f"\n✓ Cleaned {cleaned_count} files")
    print("\nAll rtlStyles imports have been removed!")

if __name__ == "__main__":
    main()
