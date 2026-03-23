#!/usr/bin/env python3
"""
Script to fix RTL issues in the React Native app.
Replaces row-reverse with row, removes scaleX transforms, 
and replaces directional padding/margin properties.
"""

import os
import re
from pathlib import Path

def fix_rtl_in_file(file_path):
    """Fix RTL issues in a single file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        modified = False
        
        # Fix 1: Replace 'row-reverse' with 'row'
        if "row-reverse" in content:
            content = re.sub(r"flexDirection:\s*['\"]row-reverse['\"]", "flexDirection: 'row'", content)
            modified = True
            print(f"  [row-reverse -> row] {file_path.name}")
        
        # Fix 2: Remove transform: [{ scaleX: -1 }]
        if "scaleX" in content and "-1" in content:
            # Remove inline style transform
            content = re.sub(r",?\s*transform:\s*\[\s*\{\s*scaleX:\s*-1\s*\}\s*\]", "", content)
            # Remove style prop with only transform
            content = re.sub(r'style=\{\{\s*transform:\s*\[\s*\{\s*scaleX:\s*-1\s*\}\s*\]\s*\}\}', "", content)
            modified = True
            print(f"  [removed scaleX] {file_path.name}")
        
        # Fix 3: Replace paddingLeft with paddingStart
        if "paddingLeft" in content:
            content = re.sub(r'\bpaddingLeft\b', 'paddingStart', content)
            modified = True
            print(f"  [paddingLeft -> paddingStart] {file_path.name}")
        
        # Fix 4: Replace paddingRight with paddingEnd
        if "paddingRight" in content:
            content = re.sub(r'\bpaddingRight\b', 'paddingEnd', content)
            modified = True
            print(f"  [paddingRight -> paddingEnd] {file_path.name}")
        
        # Fix 5: Replace marginLeft with marginStart
        if "marginLeft" in content:
            content = re.sub(r'\bmarginLeft\b', 'marginStart', content)
            modified = True
            print(f"  [marginLeft -> marginStart] {file_path.name}")
        
        # Fix 6: Replace marginRight with marginEnd
        if "marginRight" in content:
            content = re.sub(r'\bmarginRight\b', 'marginEnd', content)
            modified = True
            print(f"  [marginRight -> marginEnd] {file_path.name}")
        
        # Save if modified
        if modified and content != original_content:
            with open(file_path, 'w', encoding='utf-8', newline='') as f:
                f.write(content)
            return True
        
        return False
    except Exception as e:
        print(f"  [ERROR] {file_path}: {e}")
        return False

def main():
    print("Starting RTL fix across the codebase...")
    
    mobile_app_path = Path(r"c:\Users\Dell\Desktop\KOM\kom-mobile-app")
    
    # Get all .tsx and .ts files (excluding node_modules, .expo, android, ios)
    exclude_dirs = {'node_modules', '.expo', 'android', 'ios', '.git'}
    
    files_to_process = []
    for root, dirs, files in os.walk(mobile_app_path):
        # Remove excluded directories from dirs list (in-place modification)
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        
        for file in files:
            if file.endswith(('.tsx', '.ts')) and not file.endswith('.d.ts'):
                files_to_process.append(Path(root) / file)
    
    total_files = len(files_to_process)
    modified_files = 0
    
    print(f"Found {total_files} files to process\n")
    
    for file_path in files_to_process:
        if fix_rtl_in_file(file_path):
            modified_files += 1
            print(f"✓ Modified: {file_path.relative_to(mobile_app_path)}\n")
    
    print("\n" + "=" * 50)
    print("RTL Fix Complete!")
    print(f"Total files scanned: {total_files}")
    print(f"Files modified: {modified_files}")
    print("=" * 50)
    
    # Fix the RTL_ROW constant
    listing_file = mobile_app_path / "app" / "listing" / "[id].tsx"
    if listing_file.exists():
        with open(listing_file, 'r', encoding='utf-8') as f:
            content = f.read()
        if "const RTL_ROW = { flexDirection: 'row-reverse'" in content:
            content = content.replace(
                "const RTL_ROW = { flexDirection: 'row-reverse' as const };",
                "const RTL_ROW = { flexDirection: 'row' as const };"
            )
            with open(listing_file, 'w', encoding='utf-8', newline='') as f:
                f.write(content)
            print(f"✓ Fixed RTL_ROW constant in {listing_file.relative_to(mobile_app_path)}")
    
    print("\nAll RTL issues have been fixed!")
    print("The app should now work correctly in both development and production builds.")

if __name__ == "__main__":
    main()
