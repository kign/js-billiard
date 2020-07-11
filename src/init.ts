import {app, Geom} from './app';
import {html} from './html';
import * as draw from './draw';

const log_resize: boolean = false;

export function init() {
    const ctx = html.canvas.getContext('2d')!;
    html.canvas.width = window.innerWidth - 20;

    app.g = make_geom ();
    draw.draw_border(ctx);

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

            html.canvas.height += (evt.screenY - event.screenY);
            app.g = make_geom ();

            draw.draw_border(ctx);
        };

        document.addEventListener("mousemove", on_move);
        document.addEventListener("mouseup", on_up);
    });

    document.body.style.cursor = "row-resize";
}

function make_geom(): Geom {
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