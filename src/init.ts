import {App} from './app';
import {html} from './html';
import * as canvas from './canvas';

const log_resize: boolean = false;

export function setup_canvas_resize (app: App) {
    const hr = html.slider.firstElementChild as HTMLElement;
    html.slider.addEventListener("mouseover", () => {
        hr.style.visibility = "visible";
        if (log_resize)
            console.log("over");
    });
    html.slider.addEventListener("mouseout", () => {
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

            app.reset(evt.screenY - event.screenY);
        };

        document.addEventListener("mousemove", on_move);
        document.addEventListener("mouseup", on_up);
    });
}

export function setup_win_resize(app: App): void {
    window.addEventListener('resize', () => app.reset(0));
}