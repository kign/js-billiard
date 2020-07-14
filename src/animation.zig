const std = @import("std");

extern fn js_log_(arg: u8) void;

fn js_log(comptime fmt: []const u8, args: var) void {
    var _buf: [100]u8 = undefined;
    const buf = _buf[0..];
    const s = std.fmt.bufPrint(buf, fmt, args) catch "error";
    for (s) |c| {
        js_log_(c);
    }
    js_log_(0);
}

export fn add_integers(a: i32, b: i32) i32 {
    var _buf: [100]u8 = undefined;
    const buf = _buf[0..];
    js_log("Hello from add_integers({},{})", .{ a, b });
    return a + b;
}
