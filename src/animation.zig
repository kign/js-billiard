const std = @import("std");

extern fn js_log_char(arg: u8) void;

fn js_log(comptime fmt: []const u8, args: var) void {
    var _buf: [100]u8 = undefined;
    const buf = _buf[0..];
    const s = std.fmt.bufPrint(buf, fmt, args) catch "error(js_log)";
    for (s) |c| {
        js_log_char(c);
    }
    js_log_char(0);
}

var _buf1: [100]u8 = undefined;
const buf1 = _buf1[0..];

const Ball = struct {
    x: f32,
    y: f32,
    vx: f32,
    vy: f32,
    r: f32,
    m: f32,
    active: bool,
    moving: bool,

    pub fn format(self: Ball, comptime fmt: []const u8, options: std.fmt.FormatOptions, writer: var) !void {
        // See https://github.com/ziglang/zig/issues/1358 for Zig formatting options
        try writer.print("Ball(x={d:.2}, y={d:.2}, vx={d:.2}, vy={d:.2})", .{ self.x, self.y, self.vx, self.vy });
    }
};

const Box = struct {
    x0: f32, x1: f32, y0: f32, y1: f32
};

const Line = struct {
    x1: f32, y1: f32, x2: f32, y2: f32
};

const Point = struct {
    x: f32, y: f32
};

var balls: [100]Ball = undefined;
var Nb: u8 = 0;
var lines: [10]Line = undefined;
var Nl: u8 = 0;
var points: [20]Point = undefined;
var Np: u8 = 0;
var bb: Box = undefined;

export fn add_ball(x: f32, y: f32, vx: f32, vy: f32, r: f32, m: f32) void {
    const ball = Ball{
        .x = x,
        .y = y,
        .vx = vx,
        .vy = vy,
        .r = r,
        .m = m,
        .active = true,
        .moving = vx != 0 or vy != 0,
    };
    balls[Nb] = ball;
    Nb += 1;
    //js_log("Adding {} number {} with m={d:.2}, r={d:.2}", .{ball, Nb, m, r});
}

export fn add_line(x1: f32, y1: f32, x2: f32, y2: f32) void {
    lines[Nl] = Line{ .x1 = x1, .y1 = y1, .x2 = x2, .y2 = y2 };
    Nl += 1;

    points[Np] = Point{ .x = x1, .y = y1 };
    points[Np + 1] = Point{ .x = x2, .y = y2 };
    Np += 2;
}

export fn set_boundary_box(x0: f32, x1: f32, y0: f32, y1: f32) void {
    bb = Box{ .x0 = x0, .x1 = x1, .y0 = y0, .y1 = y1 };
}

export fn reset() void {
    Nb = 0;
    Nl = 0;
    Np = 0;
}

extern fn ball_status(idx: i32, active: i32, x: f32, y: f32, vx: f32, vy: f32) void;

var rcnt: i32 = 0;
export fn run(interval: f32) void {
    rcnt += 1;
    //js_log("Run {}: {} balls, {} lines, {} points", .{ rcnt, Nb, Nl, Np });

    make_step(interval);
    var ii: usize = 0;
    while (ii < Nb) : (ii += 1) {
        ball_status(@intCast(i32, ii), if (balls[ii].active) 1 else 0, balls[ii].x, balls[ii].y, balls[ii].vx, balls[ii].vy);
    }
}

const decel = 20;

fn make_step(interval: f32) void {
    var ii: usize = 0;
    while (ii < Nb) : (ii += 1) {
        const b = balls[ii];
        if (b.moving) {
            balls[ii].x += interval * b.vx;
            balls[ii].y += interval * b.vy;
            const speed = @sqrt(b.vx * b.vx + b.vy * b.vy);
            if (speed <= decel * interval) {
                balls[ii].vx = 0;
                balls[ii].vy = 0;
                balls[ii].moving = false;
            } else {
                balls[ii].vx *= (speed - decel * interval) / speed;
                balls[ii].vy *= (speed - decel * interval) / speed;
            }
        }
    }
}
