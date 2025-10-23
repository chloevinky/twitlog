#!/usr/bin/env python3
"""Generate placeholder icons for TwitLog extension"""

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("PIL not available, creating minimal icons...")
    # Create minimal placeholder files
    import struct

    def create_minimal_png(size, filepath):
        """Create a minimal valid PNG file"""
        # Create a simple colored square
        width, height = size, size

        # PNG signature
        png_signature = b'\x89PNG\r\n\x1a\n'

        # IHDR chunk
        ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)
        ihdr_crc = 0x2144df1c  # Pre-calculated CRC for this specific IHDR
        ihdr_chunk = struct.pack('>I', 13) + b'IHDR' + ihdr_data + struct.pack('>I', ihdr_crc)

        # Create image data (blue square)
        image_data = b''
        for y in range(height):
            image_data += b'\x00'  # Filter type
            for x in range(width):
                # RGB: Blue color (29, 155, 240) - Twitter blue
                image_data += bytes([29, 155, 240])

        # Compress the image data
        import zlib
        compressed_data = zlib.compress(image_data, 9)

        # IDAT chunk
        idat_length = len(compressed_data)
        idat_type = b'IDAT'
        idat_crc = zlib.crc32(idat_type + compressed_data) & 0xffffffff
        idat_chunk = struct.pack('>I', idat_length) + idat_type + compressed_data + struct.pack('>I', idat_crc)

        # IEND chunk
        iend_chunk = struct.pack('>I', 0) + b'IEND' + struct.pack('>I', 0xae426082)

        # Write PNG file
        with open(filepath, 'wb') as f:
            f.write(png_signature + ihdr_chunk + idat_chunk + iend_chunk)

    # Create icons
    create_minimal_png(16, 'icons/icon16.png')
    create_minimal_png(48, 'icons/icon48.png')
    create_minimal_png(128, 'icons/icon128.png')
    print("Created minimal PNG icons (16x16, 48x48, 128x128)")
    exit(0)

# If PIL is available, create nicer icons
def create_icon(size, filepath):
    """Create a nice icon with PIL"""
    # Create image with transparent background
    img = Image.new('RGBA', (size, size), (255, 255, 255, 0))
    draw = ImageDraw.Draw(img)

    # Draw background circle
    margin = size // 8
    draw.ellipse([margin, margin, size-margin, size-margin],
                 fill=(29, 155, 240, 255))

    # Draw a notebook/document icon
    doc_margin = size // 4
    doc_width = size - 2 * doc_margin
    doc_height = doc_width

    # White document
    draw.rectangle([doc_margin, doc_margin,
                   doc_margin + doc_width, doc_margin + doc_height],
                  fill=(255, 255, 255, 255))

    # Lines on document
    line_spacing = doc_height // 5
    line_margin = doc_margin + doc_width // 6
    for i in range(1, 4):
        y = doc_margin + i * line_spacing
        draw.line([line_margin, y, doc_margin + doc_width - doc_width // 6, y],
                 fill=(29, 155, 240, 255), width=max(1, size // 32))

    img.save(filepath, 'PNG')
    print(f"Created icon: {filepath}")

# Create all icon sizes
create_icon(16, 'icons/icon16.png')
create_icon(48, 'icons/icon48.png')
create_icon(128, 'icons/icon128.png')

print("All icons created successfully!")
