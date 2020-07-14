import {App} from './app';
import {html} from './html';
import * as canvas from './canvas';

const log_resize: boolean = false;

export function init(app: App) {
    const ctx = html.canvas.getContext('2d')!;
    html.canvas.width = window.innerWidth - 20;

    app.update_geometry(make_geom ());
    canvas.draw_border(app, ctx);
    app.draw_balls();

    const hr = html.slider.firstElementChild as HTMLElement;
    html.slider.addEventListener("mouseover", event => {
        hr.style.visibility = "visible";
        if (log_resize)
            console.log("over");
    });
    html.slider.addEventListener("mouseout", event => {
        hr.style.visibility = "hidden";
        if (log_resize)
            console.log("out");
    });
    hr.style.visibility = "hidden";

    html.slider.addEventListener("mousedown", event => {
        if (log_resize)
            console.log("mousedown");

        const old_pos = html.slider.style.position;
        const old_top = html.slider.style.top;
        const old_cursor = document.body.style.cursor;

        document.body.style.cursor = "row-resize";

        const on_move = (evt: MouseEvent) => {
            if (log_resize)
                console.log("Shift", evt.screenY - event.screenY);

            html.slider.style.position = "fixed";
            html.slider.style.top = (evt.pageY - 10) + "px";
            html.slider.style.width = window.innerWidth + "px";
            html.slider.style.visibility = "visible";
        };

        const on_up = (evt: MouseEvent) => {
            if (log_resize)
                console.log("UP");
            document.removeEventListener("mousemove", on_move);
            document.removeEventListener("mouseup", on_up);

            html.slider.style.position = old_pos;
            html.slider.style.top = old_top;
            document.body.style.cursor = old_cursor;

            html.canvas.height += (evt.screenY - event.screenY);
            app.update_geometry(make_geom());
            canvas.draw_border(app, ctx);

        };

        document.addEventListener("mousemove", on_move);
        document.addEventListener("mouseup", on_up);
    });
    load_wasm ();
}

function make_geom() {
    const w = html.canvas.getBoundingClientRect().width;
    const h = html.canvas.height;
    return {
        W: w,
        H: h,
        round: 50,
        offset: 10,
        middle: h < 0.75 * w
    };
}

interface Iwasm {
    add_integers(a: number, b: number): number;
}


function load_wasm() {
    let wasm_log_buf:Array<string> = [];
    const importObject = {
        env: {
            js_log_: (arg : number) => {
                if (arg == 0) {
                    console.log("zig:", wasm_log_buf.join(''));
                    wasm_log_buf = [];
                }
                else
                    wasm_log_buf.push(String.fromCharCode(arg));
            }
        },
        // some black magic
        wasi_unstable: {
            proc_exit: arg => console.log("proc_exit", arg),
            fd_write: arg => console.log("fd_write", arg)
        }
    };

    WebAssembly.instantiateStreaming(fetch('animation.wasm'), importObject)
        .then(m => {
            const mod = m.instance.exports as unknown as Iwasm;
            console.log("12 + 17 =", mod.add_integers(12, 17));
        });

}