const std = @import("std");

extern fn js_log_char(arg: u8) void;

extern fn js_atan2(a: f32, b: f32) f32;

const PI: f32 = 3.1415926535897932384626433832795028841971693993751058209749445923078;

const teps = 1.0e-5;

fn js_log(comptime fmt: []const u8, args: var) void {
    var _buf: [200]u8 = undefined;
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
    //js_log("[{}] Run IN: {} balls, {} lines, {} points", .{ rcnt, Nb, Nl, Np });

    make_step(interval);
    var ii: usize = 0;
    while (ii < Nb) : (ii += 1) {
        const b = balls[ii];
        ball_status(@intCast(i32, ii), if (b.active) 1 else 0, b.x, b.y, b.vx, b.vy);
    }
    //js_log("[{}] Run OUT", .{rcnt});
}

const decel = 20;

fn make_step(interval: f32) void {
    var ii: usize = 0;

    var t: f32 = 0;
    var iter: u32 = 0;

    while (true) {
        iter += 1;
        if (iter > 1000)
            break;

        var dt = interval - t;
        var next_ii: ?usize = null;
        var next_jj: ?usize = null;

        var vxi: f32 = undefined;
        var vyi: f32 = undefined;
        var vxj: f32 = undefined;
        var vyj: f32 = undefined;

        ii = 0;
        while (ii < Nb) : (ii += 1) {
            const b = balls[ii];

            if (!b.active)
                continue;

            var jj: usize = ii + 1;
            while (jj < Nb) : (jj += 1) {
                if (!balls[jj].active)
                    continue;

                if (ball_x_ball(b, balls[jj], &dt, &vxi, &vyi, &vxj, &vyj)) {
                    next_ii = ii;
                    next_jj = jj;

                    //js_log("[{}.{}] Ball {} vx {}: t = {d:.3}, 1st ({d:.3},{d:.3}) => ({d:.3},{d:.3}), 2nd ({d:.3},{d:.3}) => ({d:.3},{d:.3})", .{ rcnt, iter, ii, jj, t + dt, balls[ii].vx, balls[ii].vy, vxi, vyi, balls[jj].vx, balls[jj].vy, vxj, vyj });
                }
            }

            if (!b.moving)
                continue;

            for (lines[0..Nl]) |l| {
                if (ball_x_line(b, l, &dt, &vxi, &vyi)) {
                    next_ii = ii;
                    next_jj = null;
                }
            }

            for (points[0..Np]) |p| {
                if (ball_x_point(b, p, &dt, &vxi, &vyi)) {
                    next_ii = ii;
                    next_jj = null;
                }
            }
        }

        //js_log("dt = {d:.6}", .{dt});
        ii = 0;
        while (ii < Nb) : (ii += 1) {
            const b = balls[ii];
            if (b.moving and b.active) {
                balls[ii].x += dt * b.vx;
                balls[ii].y += dt * b.vy;
            }
        }

        t += dt;
        if (next_ii) |ii_| {
            if (next_jj) |jj_| {
                //js_log("[{}.{}] Ball {} collided with ball {} @ t = {d:.6}", .{ rcnt, iter, ii_, jj_, t });
                //js_log("1st ({d:.3},{d:.3}) => ({d:.3},{d:.3}), 2nd ({d:.3},{d:.3}) => ({d:.3},{d:.3})", .{ balls[ii_].vx, balls[ii_].vy, vxi, vyi, balls[jj_].vx, balls[jj_].vy, vxj, vyj });
                balls[ii_].vx = vxi;
                balls[ii_].vy = vyi;
                balls[ii_].moving = true;

                balls[jj_].vx = vxj;
                balls[jj_].vy = vyj;
                balls[jj_].moving = true;
            } else {
                //js_log("[{}.{}] Ball {} hit obstacle @ t = {d:.6}", .{ rcnt, iter, ii_, t });
                balls[ii_].vx = vxi;
                balls[ii_].vy = vyi;
                balls[ii_].moving = true;

                // // FIXME
                // var kk: usize = 0;
                // while (kk < Nb) : (kk += 1) {
                //     balls[kk].moving = false;
                //     balls[kk].vx = 0;
                //     balls[kk].vy = 0;
                // }
                // js_log("Hit break!", .{});
                // break; // FIXME
            }
        } else
            break;
    }

    ii = 0;
    while (ii < Nb) : (ii += 1) {
        const b = balls[ii];
        if (!b.active)
            continue;
        if (b.moving) {
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
        if (b.x < bb.x0 or b.x > bb.x1 or b.y < bb.y0 or b.y > bb.y1) {
            if (b.x < bb.x0)
                js_log("[{}] OOB Ball {} | x = {d:.2} < {d:.2}", .{ rcnt, ii, b.x, bb.x0 });
            if (b.x > bb.x1)
                js_log("[{}] OOB Ball {} | x = {d:.2} > {d:.2}", .{ rcnt, ii, b.x, bb.x1 });
            if (b.y < bb.y0)
                js_log("[{}] OOB Ball {} | y = {d:.2} < {d:.2}", .{ rcnt, ii, b.y, bb.y0 });
            if (b.y > bb.y1)
                js_log("[{}] OOB Ball {} | y = {d:.2} > {d:.2}", .{ rcnt, ii, b.y, bb.y1 });
            //js_log("Out of the box!", .{});
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

    const ok1 = t1 > teps and p1 > 0 and p1 < 1;
    const ok2 = t2 > teps and p2 > 0 and p2 < 1;

    if (!ok1 and !ok2)
        return false;

    const t_ = if (!ok1) t2 else if (!ok2) t1 else if (t1 < t2) t1 else t2;
    if (t_ >= t.*)
        return false;

    t.* = t_;
    const s = b.vx * lx + b.vy * ly;
    vx.* = 2 * s * lx / d2 - b.vx;
    vy.* = 2 * s * ly / d2 - b.vy;

    //js_log("ball_x_line returns {}", .{t_});
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

    if (t1 <= teps and t2 <= teps)
        return false;

    const t_ = if (t1 <= teps) t2 else if (t2 <= teps) t1 else if (t1 < t2) t1 else t2;

    //js_log("Solution for {} @ {}", .{p, t_});
    if (t_ >= t.*)
        return false;

    const gx = p.x - b.x - t_ * b.vx;
    const gy = p.y - b.y - t_ * b.vy;
    const s = b.vx * gy - b.vy * gx;
    t.* = t_;
    vx.* = 2 * s * gy / b.r / b.r - b.vx;
    vy.* = -2 * s * gx / b.r / b.r - b.vy;

    //js_log("ball_x_point returns {}", .{t_});
    return true;
}

inline fn fabs(x: f32) f32 {
    return if (x > 0) x else -x;
}

fn ball_x_ball(b1: Ball, b2: Ball, t: *f32, vx1: *f32, vy1: *f32, vx2: *f32, vy2: *f32) bool {
    const eps = 1.0e-4;
    const isnan = std.math.isNan;

    const select_new = true;

    var vx1_o :f32 = undefined;
    var vy1_o :f32 = undefined;
    var vx2_o :f32 = undefined;
    var vy2_o :f32 = undefined;
    var t_o = t.*;

    const r_o = ball_x_ball_old(b1, b2, &t_o, &vx1_o, &vy1_o, &vx2_o, &vy2_o);

    var vx1_n :f32 = undefined;
    var vy1_n :f32 = undefined;
    var vx2_n :f32 = undefined;
    var vy2_n :f32 = undefined;
    var t_n = t.*;

    const r_n = ball_x_ball_new(b1, b2, &t_n, &vx1_n, &vy1_n, &vx2_n, &vy2_n);

    if (r_o != r_n) {
        js_log("INCONSISTENCY: Old code {}, new {}", .{r_o, r_n});
    }
    else if (r_o) {
        if (fabs(t_o - t_n) > eps)
            js_log("INCONSISTENCY: t_o = {d:.4}, t_n = {d:.4}, diff = {}", .{t_o, t_n, t_n-t_o});
        if (fabs(vx1_o - vx1_n) > eps)
            js_log("INCONSISTENCY: vx1_o = {d:.4}, vx1_n = {d:.4}, diff = {}", .{vx1_o, vx1_n, vx1_n-vx1_o} );
        if (fabs(vy1_o - vy1_n) > eps)
            js_log("INCONSISTENCY: vy1_o = {d:.4}, vy1_n = {d:.4}, diff = {}", .{vy1_o, vy1_n, vy1_n-vy1_o} );
        if (fabs(vx2_o - vx2_n) > eps)
            js_log("INCONSISTENCY: vx2_o = {d:.4}, vx2_n = {d:.4}, diff = {}", .{vx2_o, vx2_n, vx2_n-vx2_o} );
        if (fabs(vy2_o - vy2_n) > eps)
            js_log("INCONSISTENCY: vy2_o = {d:.4}, vy2_n = {d:.4}, diff = {}", .{vy2_o, vy2_n, vy2_n-vy2_o} );

        if (isnan(t_o) or isnan(vx1_o) or isnan(vy1_o) or isnan(vx2_o) or isnan(vy2_o))
            js_log("ERROR: t_o={d:.2}, vx1_o={d:.2}, vy1_o={d:.2}, vx2_o={d:.2}, vy2_o={d:.2}",
            .{t_o, vx1_o, vy1_o, vx2_o, vy2_o});
        if (isnan(t_n) or isnan(vx1_n) or isnan(vy1_n) or isnan(vx2_n) or isnan(vy2_n))
            js_log("ERROR: t_n={d:.2}, vx1_n={d:.2}, vy1_n={d:.2}, vx2_n={d:.2}, vy2_n={d:.2}",
            .{t_n, vx1_n, vy1_n, vx2_n, vy2_n});

    }

    if (select_new) {
        if (r_n) {
            t.* = t_n;
            vx1.* = vx1_n;
            vy1.* = vy1_n;
            vx2.* = vx2_n;
            vy2.* = vy2_n;
        }

        return r_n;
    }
    else {
        if (r_o) {
            t.* = t_o;
            vx1.* = vx1_o;
            vy1.* = vy1_o;
            vx2.* = vx2_o;
            vy2.* = vy2_o;
        }

        return r_o;
    }
}

fn ball_x_ball_old(b1: Ball, b2: Ball, t: *f32, vx1: *f32, vy1: *f32, vx2: *f32, vy2: *f32) bool {
    const x = b1.x - b2.x;
    const vx = b1.vx - b2.vx;
    const y = b1.y - b2.y;
    const vy = b1.vy - b2.vy;
    const r2 = (b1.r + b2.r) * (b1.r + b2.r);
    const de = vx * vx + vy * vy;
    const d = 2 * x * y * vx * vy + r2 * de - x * x * vy * vy - y * y * vx * vx;

    if (vx > -teps and vx < teps and vy > -teps and vy < teps)
        return false;

    if (d < 0)
        return false;

    const sd = @sqrt(d);
    const t1 = -(sd + x * vx + y * vy) / de;
    const t2 = (sd - x * vx - y * vy) / de;

    if (t1 <= teps and t2 <= teps)
        return false;

    const t_ = if (t1 <= teps) t2 else if (t2 <= teps) t1 else if (t1 < t2) t1 else t2;
    if (t_ >= t.*)
        return false;

    const x1 = b1.x + t_ * b1.vx;
    const y1 = b1.y + t_ * b1.vy;
    const x2 = b2.x + t_ * b2.vx;
    const y2 = b2.y + t_ * b2.vy;
    const v1 = @sqrt(b1.vx * b1.vx + b1.vy * b1.vy);
    const v2 = @sqrt(b2.vx * b2.vx + b2.vy * b2.vy);
    const m = b1.m + b2.m;

    // Base on: https://williamecraver.wixsite.com/elastic-equations
    // See also: https://www.real-world-physics-problems.com/elastic-collision.html
    const p1 = js_atan2(b1.vy, b1.vx);
    const p2 = js_atan2(b2.vy, b2.vx);
    const f = js_atan2(y2 - y1, x2 - x1);
    const z1 = v1 * @cos(p1 - f) * (b1.m - b2.m) + 2 * b2.m * v2 * @cos(p2 - f);
    const z2 = v2 * @cos(p2 - f) * (b2.m - b1.m) + 2 * b1.m * v1 * @cos(p1 - f);

    t.* = t_;
    vx1.* = z1 * @cos(f) / m + v1 * @sin(p1 - f) * @cos(f + PI / 2);
    vy1.* = z1 * @sin(f) / m + v1 * @sin(p1 - f) * @sin(f + PI / 2);
    vx2.* = z2 * @cos(f) / m + v2 * @sin(p2 - f) * @cos(f + PI / 2);
    vy2.* = z2 * @sin(f) / m + v2 * @sin(p2 - f) * @sin(f + PI / 2);

    //js_log("OLD {} x {} returns {d:.3} @ ({d:.3},{d:.3}) ({d:.3},{d:.3})", .{b1, b2, t_, vx1.*, vy1.*, vx2.*, vy2.*});
    return true;
}

fn ball_x_ball_new(b1: Ball, b2: Ball, t: *f32, vx1: *f32, vy1: *f32, vx2: *f32, vy2: *f32) bool {
    const veps = 1.0e-6;
    const x = b1.x - b2.x;
    const vx = b1.vx - b2.vx;
    const y = b1.y - b2.y;
    const vy = b1.vy - b2.vy;
    const r2 = (b1.r + b2.r) * (b1.r + b2.r);
    const de = vx * vx + vy * vy;
    const d = 2 * x * y * vx * vy + r2 * de - x * x * vy * vy - y * y * vx * vx;

    if (vx > -veps and vx < veps and vy > -veps and vy < veps)
        return false;

    if (d < 0)
        return false;

    const sd = @sqrt(d);
    const t1 = -(sd + x * vx + y * vy) / de;
    const t2 = (sd - x * vx - y * vy) / de;

    if (t1 <= teps and t2 <= teps)
        return false;

    const t_ = if (t1 <= teps) t2 else if (t2 <= teps) t1 else if (t1 < t2) t1 else t2;
    if (t_ >= t.*)
        return false;

    const x1 = b1.x + t_ * b1.vx;
    const y1 = b1.y + t_ * b1.vy;
    const x2 = b2.x + t_ * b2.vx;
    const y2 = b2.y + t_ * b2.vy;
    //const v1 = @sqrt(b1.vx * b1.vx + b1.vy * b1.vy);
    //const v2 = @sqrt(b2.vx * b2.vx + b2.vy * b2.vy);
    const m = b1.m + b2.m;

    // Based on: https://williamecraver.wixsite.com/elastic-equations
    // See also: https://www.real-world-physics-problems.com/elastic-collision.html
    //const p1 = atan2(b1.vy, b1.vx);
    const v1 = @sqrt(b1.vy*b1.vy + b1.vx*b1.vx);
    const p1_sin = if (v1 > veps) b1.vy/v1 else 0;
    const p1_cos = if (v1 > veps) b1.vx/v1 else 1;

    //const p2 = atan2(b2.vy, b2.vx);
    const v2 = @sqrt(b2.vy*b2.vy + b2.vx*b2.vx);
    const p2_sin = if (v2 > veps) b2.vy/v2 else 0;
    const p2_cos = if (v2 > veps) b2.vx/v2 else 1;

    //const f = atan2(y2 - y1, x2 - x1);
    const f_d = @sqrt((y2 - y1)*(y2 - y1) + (x2 - x1)*(x2 - x1));
    const f_sin = (y2 - y1)/f_d;
    const f_cos = (x2 - x1)/f_d;

    const p1f_cos = p1_cos*f_cos + p1_sin*f_sin; // cos(p1 - f) = cos(p1)cos(f) + sin(p1)sin(f)
    const p1f_sin = p1_sin*f_cos - p1_cos*f_sin; // sin(p1 - f) = sin(p1)cos(f) - cos(p1)sin(f)
    const p2f_cos = p2_cos*f_cos + p2_sin*f_sin; // cos(p2 - f) = cos(p2)cos(f) + sin(p2)sin(f)
    const p2f_sin = p2_sin*f_cos - p2_cos*f_sin; // sin(p2 - f) = sin(p2)cos(f) - cos(p2)sin(f)

    const z1 = v1 * p1f_cos * (b1.m - b2.m) + 2 * b2.m * v2 * p2f_cos;
    const z2 = v2 * p2f_cos * (b2.m - b1.m) + 2 * b1.m * v1 * p1f_cos;

    t.* = t_;
    vx1.* = z1 * f_cos / m - v1 * p1f_sin * f_sin;
    vy1.* = z1 * f_sin / m + v1 * p1f_sin * f_cos;
    vx2.* = z2 * f_cos / m - v2 * p2f_sin * f_sin;
    vy2.* = z2 * f_sin / m + v2 * p2f_sin * f_cos;

    //js_log("NEW {} x {} returns {d:.3} @ ({d:.3},{d:.3}) ({d:.3},{d:.3})", .{b1, b2, t_, vx1.*, vy1.*, vx2.*, vy2.*});
    return true;
}
