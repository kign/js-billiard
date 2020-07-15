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
    x: f32, 
    y: f32,

    pub fn format(self: Point, comptime fmt: []const u8, options: std.fmt.FormatOptions, writer: var) !void {
        try writer.print("Point(x={d:.2}, {d:.2})", .{ self.x, self.y });
    }
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
        const b = balls[ii];
        ball_status(@intCast(i32, ii), if (b.active) 1 else 0, b.x, b.y, b.vx, b.vy);
    }
}

const decel = 20;

fn make_step(interval: f32) void {
    var ii: usize = 0;

    var t: f32 = 0;

    while (true) {
        var t1 = interval;
        var next_ii: ?usize = null;
        var vx: f32 = undefined;
        var vy: f32 = undefined;

        ii = 0;
        while (ii < Nb) : (ii += 1) {
            const b = balls[ii];
            if (!b.moving)
                continue;

            for (lines[0..Nl]) |l| {
                if (ball_x_line(b, l, &t1, &vx, &vy))
                    next_ii = ii;
            }

            for (points[0..Np]) |p| {
                if (ball_x_point(b, p, &t1, &vx, &vy))
                    next_ii = ii;
            }
        }

        //js_log("t1 = {d:.6}", .{t1});
        ii = 0;
        while (ii < Nb) : (ii += 1) {
            const b = balls[ii];
            if (b.moving) {
                balls[ii].x += (t1 - t) * b.vx;
                balls[ii].y += (t1 - t) * b.vy;
            }
        }

        t = t1;
        if (next_ii) |idx| {
            js_log("Hit obstacled @ t = {d:.6}", .{t});
            balls[idx].vx = vx;
            balls[idx].vy = vy;
        } else
            break;
    }

    ii = 0;
    while (ii < Nb) : (ii += 1) {
        const b = balls[ii];
        if (b.moving) {
            const speed = @sqrt(b.vx * b.vx + b.vy * b.vy);
            if (speed <= decel * interval) {
                balls[ii].vx = 0;
                balls[ii].vy = 0;
                balls[ii].moving = false;
            } else {
                balls[ii].vx *= (speed - decel * interval) / speed;
                balls[ii].vy *= (speed - decel * interval) / speed;
                // if (ii == 0) {
                //     js_log("Velocity {d:.6}, {d:.6}", .{balls[ii].vx, balls[ii].vy});
                // }
            }
        }
        if (b.x < bb.x0 or b.x > bb.x1 or b.y < bb.y0 or b.y > bb.y1) {
            js_log("Out of the box!", .{});
            balls[ii].active = false;
        }
    }
}

fn ball_x_line(b: Ball, l: Line, t: *f32, vx: *f32, vy: *f32) bool {
    const lx = l.x2 - l.x1;
    const ly = l.y2 - l.y1;
    const a = b.vx * lx + b.vy * ly;
    const be = (b.x - l.x1) * lx + (b.y - l.y1) * ly;
    const d2 = lx * lx + ly * ly;
    const ux = b.vx - lx * a / d2;
    const wx = b.x - l.x1 - lx * be / d2;
    const uy = b.vy - ly * a / d2;
    const wy = b.y - l.y1 - ly * be / d2;
    const u = ux * ux + uy * uy;
    const uw = ux * wx + uy * wy;
    const w = wx * wx + wy * wy - b.r * b.r;

    const q = @sqrt(uw * uw - u * w);
    const t1 = (-uw + q) / u;
    const t2 = (-uw - q) / u;
    const p1 = (a * t1 + be) / d2;
    const p2 = (a * t2 + be) / d2;

    const ok1 = t1 > 0 and p1 > 0 and p1 < 1;
    const ok2 = t2 > 0 and p2 > 0 and p2 < 1;

    if (!ok1 and !ok2)
        return false;

    const t_ = if (!ok1) t2 else if (!ok2) t1 else if (t1 < t2) t1 else t2;
    if (t_ >= t.*)
        return false;

    t.* = t_;
    const s = b.vx * lx + b.vy * ly;
    vx.* = 2 * s * lx / d2 - b.vx;
    vy.* = 2 * s * ly / d2 - b.vy;

    return true;
}

fn ball_x_point(b: Ball, p: Point, t: *f32, vx: *f32, vy: *f32) bool {
    const v2 = b.vx * b.vx + b.vy * b.vy;
    const be = b.vx * (b.x - p.x) + b.vy * (b.y - p.y);
    const c = (b.x - p.x) * (b.x - p.x) + (b.y - p.y) * (b.y - p.y) - b.r * b.r;

    const q2 = be * be - v2 * c;
    if (q2 < 0)
        return false;

    const q = @sqrt(q2);
    const t1 = (-be - q) / v2;
    const t2 = (-be + q) / v2;

    if (t1 <= 0 and t2 <= 0)
        return false;

    const t_ = if (t1 <= 0) t2 else if (t2 <= 0) t1 else if (t1 < t2) t1 else t2;

    //js_log("Solution for {} @ {}", .{p, t_});
    if (t_ >= t.*)
        return false;

    const gx = p.x - b.x - t_ * b.vx;
    const gy = p.y - b.y - t_ * b.vy;
    const s = b.vx * gy - b.vy * gx;
    t.* = t_;
    vx.* = 2 * s * gy / b.r / b.r - b.vx;
    vy.* = -2 * s * gx / b.r / b.r - b.vy;

    return true;
}