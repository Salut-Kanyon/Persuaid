#!/usr/bin/env swift
// Optional manual clip for app-icon PNGs. Prefer the default build-macos-app-icon.sh path
// (AppIcon → iconutil, no baking) and only use this when BAKE_MACOS_SQUIRCLE=1.
//
// Usage: apply-macos-squircle.swift <input.png> <output.png> [cornerRadius@1024]
// Default corner radius @1024px: 185.

import AppKit
import CoreGraphics

guard CommandLine.arguments.count >= 3 else {
    FileHandle.standardError.write(
        Data("usage: apply-macos-squircle <input.png> <output.png> [cornerRadius@1024]\n".utf8)
    )
    exit(1)
}

let inputPath = CommandLine.arguments[1]
let outputPath = CommandLine.arguments[2]
let cornerAt1024 = CommandLine.arguments.count > 3 ? CGFloat(Double(CommandLine.arguments[3]) ?? 185) : 185

guard let nsimg = NSImage(contentsOf: URL(fileURLWithPath: inputPath)) else {
    FileHandle.standardError.write(Data("failed to load: \(inputPath)\n".utf8))
    exit(1)
}

var proposed = CGRect(origin: .zero, size: nsimg.size)
guard let cgIn = nsimg.cgImage(forProposedRect: &proposed, context: nil, hints: nil) else {
    FileHandle.standardError.write(Data("failed to get CGImage\n".utf8))
    exit(1)
}

let w = CGFloat(cgIn.width)
let h = CGFloat(cgIn.height)
let side = max(w, h)
let corner = cornerAt1024 * (side / 1024.0)

let colorSpace = CGColorSpaceCreateDeviceRGB()
let bitmapInfo = CGBitmapInfo.byteOrder32Big.union(
    CGBitmapInfo(rawValue: CGImageAlphaInfo.premultipliedLast.rawValue)
)

guard
    let ctx = CGContext(
        data: nil,
        width: Int(side),
        height: Int(side),
        bitsPerComponent: 8,
        bytesPerRow: 0,
        space: colorSpace,
        bitmapInfo: bitmapInfo.rawValue
    )
else {
    FileHandle.standardError.write(Data("failed to create context\n".utf8))
    exit(1)
}

ctx.clear(CGRect(x: 0, y: 0, width: side, height: side))

let rect = CGRect(x: 0, y: 0, width: side, height: side)
let path = CGPath(
    roundedRect: rect,
    cornerWidth: corner,
    cornerHeight: corner,
    transform: nil
)
ctx.addPath(path)
ctx.clip()

ctx.translateBy(x: 0, y: side)
ctx.scaleBy(x: 1, y: -1)

ctx.interpolationQuality = .high
let drawRect = CGRect(x: 0, y: 0, width: w, height: h)
ctx.draw(cgIn, in: drawRect)

guard let cgOut = ctx.makeImage() else {
    FileHandle.standardError.write(Data("failed to makeImage\n".utf8))
    exit(1)
}

let out = NSBitmapImageRep(cgImage: cgOut)
out.size = NSSize(width: side, height: side)
guard let pngData = out.representation(using: .png, properties: [:]) else {
    FileHandle.standardError.write(Data("failed to encode PNG\n".utf8))
    exit(1)
}

do {
    try pngData.write(to: URL(fileURLWithPath: outputPath), options: .atomic)
} catch {
    FileHandle.standardError.write(Data("write failed: \(error)\n".utf8))
    exit(1)
}
