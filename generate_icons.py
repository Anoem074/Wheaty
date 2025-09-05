#!/usr/bin/env python3
"""
Generate PWA icons for WeerApp
"""
from PIL import Image, ImageDraw, ImageFilter
import os

def create_icon(size):
    """Create a weather app icon with glass morphism effect"""
    # Create image with transparent background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Create gradient background
    for y in range(size):
        for x in range(size):
            # Gradient from top-left to bottom-right
            gradient = (x + y) / (2 * size)
            r = int(102 + gradient * 118)  # 102 to 220
            g = int(126 + gradient * 46)   # 126 to 172
            b = int(234 + gradient * 24)   # 234 to 258
            img.putpixel((x, y), (r, g, b, 255))
    
    # Add glass effect overlay
    glass_overlay = Image.new('RGBA', (size, size), (255, 255, 255, 25))
    img = Image.alpha_composite(img, glass_overlay)
    
    # Draw sun circle
    center = size // 2
    sun_radius = int(size * 0.23)
    draw.ellipse([center - sun_radius, center - sun_radius, 
                  center + sun_radius, center + sun_radius], 
                 fill=(255, 215, 0, 255))  # Gold color
    
    # Add sun rays
    ray_length = int(size * 0.15)
    ray_width = max(2, size // 64)
    
    for i in range(8):
        angle = (i * 45) * 3.14159 / 180
        start_x = center + int((sun_radius + 10) * 0.7 * 0.7)
        start_y = center + int((sun_radius + 10) * 0.7 * 0.7)
        end_x = center + int((sun_radius + ray_length) * 0.7 * 0.7)
        end_y = center + int((sun_radius + ray_length) * 0.7 * 0.7)
        
        # Rotate coordinates
        cos_a = 0.7071  # cos(45°)
        sin_a = 0.7071  # sin(45°)
        
        if i == 0:  # Right
            start_x = center + sun_radius + 10
            start_y = center
            end_x = center + sun_radius + ray_length
            end_y = center
        elif i == 1:  # Bottom-right
            start_x = center + int((sun_radius + 10) * cos_a)
            start_y = center + int((sun_radius + 10) * sin_a)
            end_x = center + int((sun_radius + ray_length) * cos_a)
            end_y = center + int((sun_radius + ray_length) * sin_a)
        elif i == 2:  # Bottom
            start_x = center
            start_y = center + sun_radius + 10
            end_x = center
            end_y = center + sun_radius + ray_length
        elif i == 3:  # Bottom-left
            start_x = center - int((sun_radius + 10) * cos_a)
            start_y = center + int((sun_radius + 10) * sin_a)
            end_x = center - int((sun_radius + ray_length) * cos_a)
            end_y = center + int((sun_radius + ray_length) * sin_a)
        elif i == 4:  # Left
            start_x = center - sun_radius - 10
            start_y = center
            end_x = center - sun_radius - ray_length
            end_y = center
        elif i == 5:  # Top-left
            start_x = center - int((sun_radius + 10) * cos_a)
            start_y = center - int((sun_radius + 10) * sin_a)
            end_x = center - int((sun_radius + ray_length) * cos_a)
            end_y = center - int((sun_radius + ray_length) * sin_a)
        elif i == 6:  # Top
            start_x = center
            start_y = center - sun_radius - 10
            end_x = center
            end_y = center - sun_radius - ray_length
        elif i == 7:  # Top-right
            start_x = center + int((sun_radius + 10) * cos_a)
            start_y = center - int((sun_radius + 10) * sin_a)
            end_x = center + int((sun_radius + ray_length) * cos_a)
            end_y = center - int((sun_radius + ray_length) * sin_a)
        
        # Draw ray
        for w in range(ray_width):
            draw.line([start_x + w, start_y + w, end_x + w, end_y + w], 
                     fill=(255, 215, 0, 255), width=1)
    
    # Add glass highlight
    highlight_size = int(size * 0.08)
    highlight_x = center - int(sun_radius * 0.7)
    highlight_y = center - int(sun_radius * 0.7)
    draw.ellipse([highlight_x, highlight_y, 
                  highlight_x + highlight_size, highlight_y + highlight_size], 
                 fill=(255, 255, 255, 80))
    
    return img

def main():
    """Generate all required icon sizes"""
    # Create icons directory if it doesn't exist
    os.makedirs('icons', exist_ok=True)
    
    # Icon sizes needed for PWA
    sizes = [72, 96, 128, 144, 152, 192, 384, 512]
    
    print("Generating PWA icons...")
    
    for size in sizes:
        print(f"Creating icon-{size}x{size}.png...")
        icon = create_icon(size)
        icon.save(f'icons/icon-{size}x{size}.png', 'PNG')
    
    print("All icons generated successfully!")
    print("Icons saved in the 'icons' directory.")

if __name__ == "__main__":
    main()
