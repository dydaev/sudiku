
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            // @ts-ignore
            callbacks.slice().forEach(fn => fn.call(this, event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.46.4' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */

    function __classPrivateFieldGet(receiver, state, kind, f) {
        if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
        if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
        return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
    }

    function __classPrivateFieldSet(receiver, state, value, kind, f) {
        if (kind === "m") throw new TypeError("Private method is not writable");
        if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
        if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
        return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    var _Settings_settings, _Settings_langs, _Settings_levels;
    class Settings$1 {
        constructor() {
            _Settings_settings.set(this, void 0);
            _Settings_langs.set(this, ["en", "ua"]);
            _Settings_levels.set(this, ["low", "medium", "height", "hard"]);
            __classPrivateFieldSet(this, _Settings_settings, writable({
                lang: 0,
                level: "medium",
                showErrors: false
            }), "f");
            //this.initial();
        }
        get settings() {
            return __classPrivateFieldGet(this, _Settings_settings, "f");
        }
        getSetting(name) {
            let res;
            __classPrivateFieldGet(this, _Settings_settings, "f").subscribe(settings => res = settings[name]);
            return res;
        }
        setSetting(name, value) {
            __classPrivateFieldGet(this, _Settings_settings, "f").update(settings => (Object.assign(Object.assign({}, settings), { [name]: value })));
        }
        getLangs() {
            return __classPrivateFieldGet(this, _Settings_langs, "f");
        }
        getLevels() {
            return __classPrivateFieldGet(this, _Settings_levels, "f");
        }
        getLevel() {
            const name = this.getSetting("level");
            switch (name) {
                case "hard":
                    return [8, 9];
                case "height":
                    return [7, 8];
                case "medium":
                    return [4, 6];
                case "low":
                    return [2, 4];
                default:
                    return [4, 6];
            }
        }
    }
    _Settings_settings = new WeakMap(), _Settings_langs = new WeakMap(), _Settings_levels = new WeakMap();

    var _Board_board, _Board_level;
    class Board {
        constructor(lvl) {
            _Board_board.set(this, void 0); // Array<IField>
            _Board_level.set(this, void 0);
            __classPrivateFieldSet(this, _Board_level, lvl, "f");
            __classPrivateFieldSet(this, _Board_board, writable([]), "f");
            this.fillBoard(true);
        }
        get squares() {
            const squares = Array(9).fill(0).map((_, num) => {
                let res;
                this.getSquareByNumber(num).subscribe(s => res = s);
                return res;
            });
            return squares;
        }
        get showBoard() {
            let res;
            __classPrivateFieldGet(this, _Board_board, "f").subscribe(b => res = b);
            return res.map(f => typeof f == "object" && "v" in f ? f.v : f);
        }
        setField(f, field) {
            __classPrivateFieldGet(this, _Board_board, "f").update(board => {
                board.splice(f, 1, field);
                return board;
            });
        }
        setFieldToSquare(s, f, field) {
            const n = this.getFieldNumBySquareAndFieldInSquare(s, f);
            this.setField(n, field);
        }
        getFieldNumBySquareAndFieldInSquare(s, f) {
            let numberFirstSquareField = this.getFirstFieldNumberBySquareNumber(s);
            const rowOfSquare = Math.floor(f / 3);
            return numberFirstSquareField + (rowOfSquare * 9 + (f % 3));
        }
        getField(f) {
            if (f >= 0 && f < (9 * 9)) {
                let res;
                __classPrivateFieldGet(this, _Board_board, "f").subscribe(b => res = b);
                return res[f];
            }
            else
                return 0;
        }
        probeGetField(index) {
            let currentProbe = 1;
            let usedNumbers = [];
            let num = 0;
            do {
                num = Math.floor(Math.random() * 9) + 1;
                if (usedNumbers.includes(num))
                    continue;
                if (!this.checkSquareByField(index, num)) {
                    if (!this.checkLineByField("x", index, num)
                        && !this.checkLineByField("y", index, num)) {
                        this.setField(index, { v: num, x: num });
                        if (index < 80) {
                            const [nextProbe, result] = this.probeGetField(index + 1);
                            currentProbe = nextProbe + 1; //currentProbe;
                            if (result == 0) {
                                this.setField(index, { v: 0, x: 0 });
                            }
                            else
                                return [currentProbe, num];
                        }
                        else {
                            return [currentProbe, num];
                        }
                    }
                }
                usedNumbers.push(num);
                num = 0;
            } while (usedNumbers.length < 9);
            return [currentProbe, 0];
        }
        fillBoard(isNewBoard = false) {
            __classPrivateFieldGet(this, _Board_board, "f").update(_ => Array(9 * 9).fill(0));
            this.probeGetField(0);
            this.hideFields(__classPrivateFieldGet(this, _Board_level, "f"));
        }
        hideFields(difficult = [4, 6]) {
            for (let square = 0; square < 9; square++) {
                for (let countShowsFields = Math.floor(Math.random() * (difficult[1] - difficult[0] + 1)) + difficult[0]; countShowsFields > 0; countShowsFields--) {
                    this.setFieldToSquare(square, Math.floor(Math.random() * (8 + 1)), { v: 0, x: 0 });
                }
            }
        }
        getLineByField(l, f) {
            return derived(__classPrivateFieldGet(this, _Board_board, "f"), $board => $board.reduce((acc, field, ind) => {
                if (l == "y") {
                    if (ind % 9 === f % 9)
                        return [...acc, field];
                }
                else {
                    if (Math.floor(ind / 9) === Math.floor(f / 9))
                        return [...acc, field];
                }
                return acc;
            }, []));
        }
        getFieldsIndexesForArray(arr, n) {
            return arr.reduce((acc, f, ind) => (typeof f == "object" && "v" in f && f.v == n ? [...acc, ind] : acc), []);
        }
        getIndexesOfNumberInLine(l, f, n) {
            let line;
            this.getLineByField(l, f).subscribe(l => line = l);
            return this.getFieldsIndexesForArray(line, n);
        }
        getIndexesOfNumberInSquare(f, n) {
            let square;
            this.getSquareByField(f).subscribe(s => square = s);
            return this.getFieldsIndexesForArray(square, n);
        }
        checkLineByField(l, f, n) {
            return !!this.getIndexesOfNumberInLine(l, f, n).length;
        }
        checkSquareByField(f, n) {
            return !!this.getIndexesOfNumberInSquare(f, n).length;
        }
        checkField(f) {
        }
        getSquareByField(f) {
            const minX = Math.floor((f % 9) / 3) * 3;
            const minY = Math.floor(Math.floor(f / 9) / 3) * 3;
            return derived(__classPrivateFieldGet(this, _Board_board, "f"), $board => {
                return $board.reduce((acc, field, ind) => {
                    if (ind % 9 >= minX && ind % 9 <= (minX + 2)
                        && (Math.floor(ind / 9) >= minY && Math.floor(ind / 9) <= (minY + 2)))
                        return [...acc, field];
                    return acc;
                }, []);
            });
        }
        getSquareNumberByFieldNumber(n) {
            return (Math.floor(n / 3) % 3) + ((Math.floor(n / 27) * 3));
        }
        getFirstFieldNumberBySquareNumber(n) {
            return ((n * 3) + Math.floor(n / 3) * 18);
        }
        getSquareByNumber(n) {
            return this.getSquareByField(this.getFirstFieldNumberBySquareNumber(n));
        }
    }
    _Board_board = new WeakMap(), _Board_level = new WeakMap();

    /* src/components/Field.svelte generated by Svelte v3.46.4 */

    const { Object: Object_1 } = globals;
    const file$6 = "src/components/Field.svelte";

    function create_fragment$6(ctx) {
    	let div;
    	let input;
    	let input_disabled_value;
    	let input_value_value;
    	let input_class_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			input = element("input");
    			attr_dev(input, "maxlength", "1");
    			attr_dev(input, "min", "1");
    			attr_dev(input, "max", "9");
    			attr_dev(input, "size", "1");
    			attr_dev(input, "type", "number");
    			input.disabled = input_disabled_value = /*value*/ ctx[0].x || false;
    			input.value = input_value_value = /*value*/ ctx[0].v || "";
    			attr_dev(input, "class", input_class_value = "" + (null_to_empty(/*isError*/ ctx[1] ? "field-doubling" : "") + " svelte-dyvtev"));
    			add_location(input, file$6, 21, 1, 493);
    			attr_dev(div, "class", "su-field svelte-dyvtev");
    			add_location(div, file$6, 20, 0, 469);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, input);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "keydown", prevent_default(/*handleChangeInput*/ ctx[2]), false, true, false),
    					listen_dev(input, "input", prevent_default(/*input_handler*/ ctx[6]), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*value*/ 1 && input_disabled_value !== (input_disabled_value = /*value*/ ctx[0].x || false)) {
    				prop_dev(input, "disabled", input_disabled_value);
    			}

    			if (dirty & /*value*/ 1 && input_value_value !== (input_value_value = /*value*/ ctx[0].v || "") && input.value !== input_value_value) {
    				prop_dev(input, "value", input_value_value);
    			}

    			if (dirty & /*isError*/ 2 && input_class_value !== (input_class_value = "" + (null_to_empty(/*isError*/ ctx[1] ? "field-doubling" : "") + " svelte-dyvtev"))) {
    				attr_dev(input, "class", input_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Field', slots, []);
    	let { value = { v: 0, x: 0 } } = $$props;
    	let { onChangeField } = $$props;
    	let { isError = false } = $$props;
    	let { indF } = $$props;
    	let { indS } = $$props;

    	const handleChangeInput = e => {
    		const key = e.key;

    		if (key * 1 >= 1 && key * 1 < 10) {
    			onChangeField(indS, indF, key * 1);
    			$$invalidate(0, value = Object.assign(Object.assign({}, value), { v: key * 1 }));
    		} else {
    			$$invalidate(0, value = Object.assign(Object.assign({}, value), { v: "" }));
    		}
    	};

    	const writable_props = ['value', 'onChangeField', 'isError', 'indF', 'indS'];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Field> was created with unknown prop '${key}'`);
    	});

    	function input_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    		if ('onChangeField' in $$props) $$invalidate(3, onChangeField = $$props.onChangeField);
    		if ('isError' in $$props) $$invalidate(1, isError = $$props.isError);
    		if ('indF' in $$props) $$invalidate(4, indF = $$props.indF);
    		if ('indS' in $$props) $$invalidate(5, indS = $$props.indS);
    	};

    	$$self.$capture_state = () => ({
    		value,
    		onChangeField,
    		isError,
    		indF,
    		indS,
    		handleChangeInput
    	});

    	$$self.$inject_state = $$props => {
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    		if ('onChangeField' in $$props) $$invalidate(3, onChangeField = $$props.onChangeField);
    		if ('isError' in $$props) $$invalidate(1, isError = $$props.isError);
    		if ('indF' in $$props) $$invalidate(4, indF = $$props.indF);
    		if ('indS' in $$props) $$invalidate(5, indS = $$props.indS);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [value, isError, handleChangeInput, onChangeField, indF, indS, input_handler];
    }

    class Field extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {
    			value: 0,
    			onChangeField: 3,
    			isError: 1,
    			indF: 4,
    			indS: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Field",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*onChangeField*/ ctx[3] === undefined && !('onChangeField' in props)) {
    			console.warn("<Field> was created without expected prop 'onChangeField'");
    		}

    		if (/*indF*/ ctx[4] === undefined && !('indF' in props)) {
    			console.warn("<Field> was created without expected prop 'indF'");
    		}

    		if (/*indS*/ ctx[5] === undefined && !('indS' in props)) {
    			console.warn("<Field> was created without expected prop 'indS'");
    		}
    	}

    	get value() {
    		throw new Error("<Field>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Field>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onChangeField() {
    		throw new Error("<Field>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onChangeField(value) {
    		throw new Error("<Field>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isError() {
    		throw new Error("<Field>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isError(value) {
    		throw new Error("<Field>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get indF() {
    		throw new Error("<Field>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set indF(value) {
    		throw new Error("<Field>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get indS() {
    		throw new Error("<Field>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set indS(value) {
    		throw new Error("<Field>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Square.svelte generated by Svelte v3.46.4 */
    const file$5 = "src/components/Square.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	child_ctx[5] = i;
    	return child_ctx;
    }

    // (8:1) {#each fields as field, indF}
    function create_each_block$3(ctx) {
    	let field;
    	let current;

    	field = new Field({
    			props: {
    				value: /*field*/ ctx[3],
    				onChangeField: /*onChangeField*/ ctx[2],
    				indF: /*indF*/ ctx[5],
    				indS: /*ind*/ ctx[1]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(field.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(field, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const field_changes = {};
    			if (dirty & /*fields*/ 1) field_changes.value = /*field*/ ctx[3];
    			if (dirty & /*onChangeField*/ 4) field_changes.onChangeField = /*onChangeField*/ ctx[2];
    			if (dirty & /*ind*/ 2) field_changes.indS = /*ind*/ ctx[1];
    			field.$set(field_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(field.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(field.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(field, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(8:1) {#each fields as field, indF}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let div;
    	let current;
    	let each_value = /*fields*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "su-square svelte-iioq27");
    			add_location(div, file$5, 6, 0, 126);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*fields, onChangeField, ind*/ 7) {
    				each_value = /*fields*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Square', slots, []);
    	let { fields } = $$props;
    	let { ind } = $$props;
    	let { onChangeField } = $$props;
    	const writable_props = ['fields', 'ind', 'onChangeField'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Square> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('fields' in $$props) $$invalidate(0, fields = $$props.fields);
    		if ('ind' in $$props) $$invalidate(1, ind = $$props.ind);
    		if ('onChangeField' in $$props) $$invalidate(2, onChangeField = $$props.onChangeField);
    	};

    	$$self.$capture_state = () => ({ Field, fields, ind, onChangeField });

    	$$self.$inject_state = $$props => {
    		if ('fields' in $$props) $$invalidate(0, fields = $$props.fields);
    		if ('ind' in $$props) $$invalidate(1, ind = $$props.ind);
    		if ('onChangeField' in $$props) $$invalidate(2, onChangeField = $$props.onChangeField);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [fields, ind, onChangeField];
    }

    class Square extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { fields: 0, ind: 1, onChangeField: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Square",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*fields*/ ctx[0] === undefined && !('fields' in props)) {
    			console.warn("<Square> was created without expected prop 'fields'");
    		}

    		if (/*ind*/ ctx[1] === undefined && !('ind' in props)) {
    			console.warn("<Square> was created without expected prop 'ind'");
    		}

    		if (/*onChangeField*/ ctx[2] === undefined && !('onChangeField' in props)) {
    			console.warn("<Square> was created without expected prop 'onChangeField'");
    		}
    	}

    	get fields() {
    		throw new Error("<Square>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fields(value) {
    		throw new Error("<Square>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get ind() {
    		throw new Error("<Square>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ind(value) {
    		throw new Error("<Square>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onChangeField() {
    		throw new Error("<Square>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onChangeField(value) {
    		throw new Error("<Square>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Board.svelte generated by Svelte v3.46.4 */

    const { console: console_1$2 } = globals;
    const file$4 = "src/components/Board.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	child_ctx[8] = i;
    	return child_ctx;
    }

    // (22:1) {#each squares as square, ind}
    function create_each_block$2(ctx) {
    	let square;
    	let current;

    	square = new Square({
    			props: {
    				ind: /*ind*/ ctx[8],
    				fields: /*square*/ ctx[6],
    				onChangeField: /*handleChangeField*/ ctx[1]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(square.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(square, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(square.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(square.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(square, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(22:1) {#each squares as square, ind}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div;
    	let current;
    	let each_value = /*squares*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "su-board svelte-c5y99c");
    			add_location(div, file$4, 20, 0, 892);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*squares, handleChangeField*/ 3) {
    				each_value = /*squares*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Board', slots, []);
    	let { settings } = $$props;
    	const level = settings.getLevel();
    	const showingErr = settings.getSetting("showErrors");
    	const boardStore = new Board(level);
    	const { squares } = boardStore;

    	const handleChangeField = (nSquare, nField, num = 0) => {
    		const numField = boardStore.getFieldNumBySquareAndFieldInSquare(nSquare, nField);
    		boardStore.setField(numField, { v: num, x: 0 });
    		const doubleX = boardStore.getIndexesOfNumberInLine("x", numField, num);
    		const doubleY = boardStore.getIndexesOfNumberInLine("y", numField, num);
    		const doubleSqu = boardStore.getIndexesOfNumberInSquare(numField, num);

    		if (doubleX.length > 1 || doubleY.length > 1 || doubleSqu.length > 1) {
    			console.log(doubleX, doubleY, doubleSqu);
    			console.log(nSquare, nField, numField);
    		}
    	};

    	const writable_props = ['settings'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$2.warn(`<Board> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('settings' in $$props) $$invalidate(2, settings = $$props.settings);
    	};

    	$$self.$capture_state = () => ({
    		Board,
    		Square,
    		settings,
    		level,
    		showingErr,
    		boardStore,
    		squares,
    		handleChangeField
    	});

    	$$self.$inject_state = $$props => {
    		if ('settings' in $$props) $$invalidate(2, settings = $$props.settings);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [squares, handleChangeField, settings];
    }

    class Board_1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { settings: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Board_1",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*settings*/ ctx[2] === undefined && !('settings' in props)) {
    			console_1$2.warn("<Board> was created without expected prop 'settings'");
    		}
    	}

    	get settings() {
    		throw new Error("<Board>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set settings(value) {
    		throw new Error("<Board>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var dict = () => {
        const dict = {
            "s_err": ["Show errors", "Показати похибки"],
            "new_g": ["New game", "Нова гра"],
            "low": ["Low", "Легкий"],
            "medium": ["Medium", "Середнiй"],
            "height": ["Hight", "Важкий"],
            "hard": ["Hard", "Дуже важкий"],
            "sett": ["Settings", "Налаштунки"],
            "lev": ["Level", "Рiвень"],
            "score": ["Scores", "Статистика"],
            "": ["", ""],
            //"":["", ""],
        };
        return (word, lang) => dict[word][lang];
    };

    /* src/components/Settings.svelte generated by Svelte v3.46.4 */

    const { console: console_1$1 } = globals;
    const file$3 = "src/components/Settings.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	child_ctx[13] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[14] = list[i];
    	return child_ctx;
    }

    // (38:3) {#each levels as level}
    function create_each_block_1(ctx) {
    	let option;
    	let t_value = /*i18*/ ctx[8](/*level*/ ctx[14], /*params*/ ctx[0].lang) + "";
    	let t;
    	let option_selected_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = /*level*/ ctx[14];
    			option.value = option.__value;

    			option.selected = option_selected_value = /*params*/ ctx[0].level == /*level*/ ctx[14]
    			? true
    			: false;

    			add_location(option, file$3, 38, 4, 1148);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*params*/ 1 && t_value !== (t_value = /*i18*/ ctx[8](/*level*/ ctx[14], /*params*/ ctx[0].lang) + "")) set_data_dev(t, t_value);

    			if (dirty & /*params*/ 1 && option_selected_value !== (option_selected_value = /*params*/ ctx[0].level == /*level*/ ctx[14]
    			? true
    			: false)) {
    				prop_dev(option, "selected", option_selected_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(38:3) {#each levels as level}",
    		ctx
    	});

    	return block;
    }

    // (44:3) {#each langs as lang, ind}
    function create_each_block$1(ctx) {
    	let li;
    	let a;
    	let t_value = /*lang*/ ctx[11] + "";
    	let t;
    	let a_class_value;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[10](/*ind*/ ctx[13]);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			a = element("a");
    			t = text(t_value);

    			attr_dev(a, "class", a_class_value = "" + (null_to_empty(/*params*/ ctx[0].lang == /*ind*/ ctx[13]
    			? "active"
    			: "") + " svelte-qb273z"));

    			add_location(a, file$3, 44, 8, 1388);
    			attr_dev(li, "class", "svelte-qb273z");
    			add_location(li, file$3, 44, 4, 1384);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, a);
    			append_dev(a, t);

    			if (!mounted) {
    				dispose = listen_dev(a, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*params*/ 1 && a_class_value !== (a_class_value = "" + (null_to_empty(/*params*/ ctx[0].lang == /*ind*/ ctx[13]
    			? "active"
    			: "") + " svelte-qb273z"))) {
    				attr_dev(a, "class", a_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(44:3) {#each langs as lang, ind}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let button0;
    	let div0;
    	let t0;
    	let div1;
    	let t1;
    	let div2;
    	let button0_class_value;
    	let t2;
    	let nav;
    	let ul1;
    	let li0;
    	let button1;
    	let t4;
    	let button2;
    	let t6;
    	let li1;
    	let div3;
    	let t7;
    	let li2;
    	let t8_value = /*i18*/ ctx[8]("lev", /*params*/ ctx[0].lang) + "";
    	let t8;
    	let t9;
    	let select;
    	let t10;
    	let li3;
    	let ul0;
    	let t11;
    	let li4;
    	let t12_value = /*i18*/ ctx[8]("s_err", /*params*/ ctx[0].lang) + "";
    	let t12;
    	let t13;
    	let input;
    	let input_checked_value;
    	let mounted;
    	let dispose;
    	let each_value_1 = /*levels*/ ctx[3];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let each_value = /*langs*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			button0 = element("button");
    			div0 = element("div");
    			t0 = space();
    			div1 = element("div");
    			t1 = space();
    			div2 = element("div");
    			t2 = space();
    			nav = element("nav");
    			ul1 = element("ul");
    			li0 = element("li");
    			button1 = element("button");
    			button1.textContent = `${"<"}`;
    			t4 = space();
    			button2 = element("button");
    			button2.textContent = `${">"}`;
    			t6 = space();
    			li1 = element("li");
    			div3 = element("div");
    			t7 = space();
    			li2 = element("li");
    			t8 = text(t8_value);
    			t9 = text(": ");
    			select = element("select");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t10 = space();
    			li3 = element("li");
    			ul0 = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t11 = space();
    			li4 = element("li");
    			t12 = text(t12_value);
    			t13 = text(": ");
    			input = element("input");
    			attr_dev(div0, "class", "line svelte-qb273z");
    			add_location(div0, file$3, 24, 1, 757);
    			attr_dev(div1, "class", "line svelte-qb273z");
    			add_location(div1, file$3, 25, 1, 778);
    			attr_dev(div2, "class", "line svelte-qb273z");
    			add_location(div2, file$3, 26, 1, 799);
    			attr_dev(button0, "class", button0_class_value = "menu-button " + (/*showMenu*/ ctx[1] ? "active" : "") + " svelte-qb273z");
    			add_location(button0, file$3, 23, 0, 676);
    			add_location(button1, file$3, 32, 3, 915);
    			add_location(button2, file$3, 33, 3, 943);
    			attr_dev(li0, "class", "menu__fields svelte-qb273z");
    			add_location(li0, file$3, 31, 2, 886);
    			attr_dev(div3, "class", "line svelte-qb273z");
    			add_location(div3, file$3, 35, 27, 1003);
    			attr_dev(li1, "class", "menu__fields svelte-qb273z");
    			add_location(li1, file$3, 35, 2, 978);
    			add_location(select, file$3, 36, 54, 1082);
    			attr_dev(li2, "class", "menu__fields svelte-qb273z");
    			add_location(li2, file$3, 36, 2, 1030);
    			attr_dev(ul0, "class", "menu__fields field-lang svelte-qb273z");
    			add_location(ul0, file$3, 42, 3, 1313);
    			attr_dev(li3, "class", "menu__fields svelte-qb273z");
    			add_location(li3, file$3, 41, 2, 1284);
    			attr_dev(input, "type", "checkbox");
    			input.checked = input_checked_value = /*params*/ ctx[0].showErrors;
    			add_location(input, file$3, 49, 32, 1573);
    			attr_dev(li4, "class", "menu__fields svelte-qb273z");
    			add_location(li4, file$3, 48, 2, 1515);
    			attr_dev(ul1, "class", "svelte-qb273z");
    			add_location(ul1, file$3, 30, 1, 879);
    			set_style(nav, "right", /*showMenu*/ ctx[1] ? "0" : "-100%");
    			attr_dev(nav, "class", "svelte-qb273z");
    			add_location(nav, file$3, 29, 0, 830);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button0, anchor);
    			append_dev(button0, div0);
    			append_dev(button0, t0);
    			append_dev(button0, div1);
    			append_dev(button0, t1);
    			append_dev(button0, div2);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, nav, anchor);
    			append_dev(nav, ul1);
    			append_dev(ul1, li0);
    			append_dev(li0, button1);
    			append_dev(li0, t4);
    			append_dev(li0, button2);
    			append_dev(ul1, t6);
    			append_dev(ul1, li1);
    			append_dev(li1, div3);
    			append_dev(ul1, t7);
    			append_dev(ul1, li2);
    			append_dev(li2, t8);
    			append_dev(li2, t9);
    			append_dev(li2, select);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(select, null);
    			}

    			append_dev(ul1, t10);
    			append_dev(ul1, li3);
    			append_dev(li3, ul0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul0, null);
    			}

    			append_dev(ul1, t11);
    			append_dev(ul1, li4);
    			append_dev(li4, t12);
    			append_dev(li4, t13);
    			append_dev(li4, input);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*onToggleMenu*/ ctx[4], false, false, false),
    					listen_dev(select, "change", /*onChangeLevel*/ ctx[6], false, false, false),
    					listen_dev(input, "change", /*handleChangeShowingErr*/ ctx[7], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*showMenu*/ 2 && button0_class_value !== (button0_class_value = "menu-button " + (/*showMenu*/ ctx[1] ? "active" : "") + " svelte-qb273z")) {
    				attr_dev(button0, "class", button0_class_value);
    			}

    			if (dirty & /*params*/ 1 && t8_value !== (t8_value = /*i18*/ ctx[8]("lev", /*params*/ ctx[0].lang) + "")) set_data_dev(t8, t8_value);

    			if (dirty & /*levels, params, i18*/ 265) {
    				each_value_1 = /*levels*/ ctx[3];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty & /*params, onChangeLang, langs*/ 37) {
    				each_value = /*langs*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul0, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*params*/ 1 && t12_value !== (t12_value = /*i18*/ ctx[8]("s_err", /*params*/ ctx[0].lang) + "")) set_data_dev(t12, t12_value);

    			if (dirty & /*params*/ 1 && input_checked_value !== (input_checked_value = /*params*/ ctx[0].showErrors)) {
    				prop_dev(input, "checked", input_checked_value);
    			}

    			if (dirty & /*showMenu*/ 2) {
    				set_style(nav, "right", /*showMenu*/ ctx[1] ? "0" : "-100%");
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(nav);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Settings', slots, []);
    	let { settings } = $$props;
    	const langs = settings.getLangs();
    	const levels = settings.getLevels();
    	let params;
    	settings.settings.subscribe(s => $$invalidate(0, params = s));
    	console.log(params);
    	let showMenu = false;

    	const onToggleMenu = () => {
    		$$invalidate(1, showMenu = !showMenu);
    	};

    	const onChangeLang = langIndex => {
    		settings.setSetting("lang", langIndex);
    	};

    	const onChangeLevel = e => {
    		const newLevel = e.target.value;
    		settings.setSetting("level", newLevel);
    	};

    	const handleChangeShowingErr = () => {
    		settings.setSetting("showErrors", !params.showErrors);
    	};

    	const i18 = dict();
    	const writable_props = ['settings'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<Settings> was created with unknown prop '${key}'`);
    	});

    	const click_handler = ind => onChangeLang(ind);

    	$$self.$$set = $$props => {
    		if ('settings' in $$props) $$invalidate(9, settings = $$props.settings);
    	};

    	$$self.$capture_state = () => ({
    		dict,
    		settings,
    		langs,
    		levels,
    		params,
    		showMenu,
    		onToggleMenu,
    		onChangeLang,
    		onChangeLevel,
    		handleChangeShowingErr,
    		i18
    	});

    	$$self.$inject_state = $$props => {
    		if ('settings' in $$props) $$invalidate(9, settings = $$props.settings);
    		if ('params' in $$props) $$invalidate(0, params = $$props.params);
    		if ('showMenu' in $$props) $$invalidate(1, showMenu = $$props.showMenu);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		params,
    		showMenu,
    		langs,
    		levels,
    		onToggleMenu,
    		onChangeLang,
    		onChangeLevel,
    		handleChangeShowingErr,
    		i18,
    		settings,
    		click_handler
    	];
    }

    class Settings extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { settings: 9 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Settings",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*settings*/ ctx[9] === undefined && !('settings' in props)) {
    			console_1$1.warn("<Settings> was created without expected prop 'settings'");
    		}
    	}

    	get settings() {
    		throw new Error("<Settings>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set settings(value) {
    		throw new Error("<Settings>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Menu.svelte generated by Svelte v3.46.4 */
    const file$2 = "src/components/Menu.svelte";

    function create_fragment$2(ctx) {
    	let button0;
    	let t0_value = /*i18*/ ctx[2]("new_g", /*props*/ ctx[0].lang) + "";
    	let t0;
    	let t1;
    	let button1;
    	let t2_value = /*i18*/ ctx[2]("score", /*props*/ ctx[0].lang) + "";
    	let t2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button0 = element("button");
    			t0 = text(t0_value);
    			t1 = space();
    			button1 = element("button");
    			t2 = text(t2_value);
    			add_location(button0, file$2, 6, 0, 126);
    			add_location(button1, file$2, 7, 0, 213);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button0, anchor);
    			append_dev(button0, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, button1, anchor);
    			append_dev(button1, t2);

    			if (!mounted) {
    				dispose = listen_dev(button0, "click", /*click_handler*/ ctx[3], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*props*/ 1 && t0_value !== (t0_value = /*i18*/ ctx[2]("new_g", /*props*/ ctx[0].lang) + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*props*/ 1 && t2_value !== (t2_value = /*i18*/ ctx[2]("score", /*props*/ ctx[0].lang) + "")) set_data_dev(t2, t2_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(button1);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Menu', slots, []);
    	let { props } = $$props;
    	let { onChangePage } = $$props;
    	const i18 = dict();
    	const writable_props = ['props', 'onChangePage'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Menu> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => onChangePage("LevelMenu");

    	$$self.$$set = $$props => {
    		if ('props' in $$props) $$invalidate(0, props = $$props.props);
    		if ('onChangePage' in $$props) $$invalidate(1, onChangePage = $$props.onChangePage);
    	};

    	$$self.$capture_state = () => ({ dict, props, onChangePage, i18 });

    	$$self.$inject_state = $$props => {
    		if ('props' in $$props) $$invalidate(0, props = $$props.props);
    		if ('onChangePage' in $$props) $$invalidate(1, onChangePage = $$props.onChangePage);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [props, onChangePage, i18, click_handler];
    }

    class Menu extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { props: 0, onChangePage: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Menu",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*props*/ ctx[0] === undefined && !('props' in props)) {
    			console.warn("<Menu> was created without expected prop 'props'");
    		}

    		if (/*onChangePage*/ ctx[1] === undefined && !('onChangePage' in props)) {
    			console.warn("<Menu> was created without expected prop 'onChangePage'");
    		}
    	}

    	get props() {
    		throw new Error("<Menu>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set props(value) {
    		throw new Error("<Menu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onChangePage() {
    		throw new Error("<Menu>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onChangePage(value) {
    		throw new Error("<Menu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/StartGame.svelte generated by Svelte v3.46.4 */

    const { console: console_1 } = globals;
    const file$1 = "src/components/StartGame.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    // (15:1) {#each levels as level}
    function create_each_block(ctx) {
    	let button;
    	let t0_value = /*i18*/ ctx[2](/*level*/ ctx[7], /*params*/ ctx[0].lang) + "";
    	let t0;
    	let t1;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[6](/*level*/ ctx[7]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			t0 = text(t0_value);
    			t1 = space();
    			add_location(button, file$1, 15, 2, 350);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t0);
    			append_dev(button, t1);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*params*/ 1 && t0_value !== (t0_value = /*i18*/ ctx[2](/*level*/ ctx[7], /*params*/ ctx[0].lang) + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(15:1) {#each levels as level}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div;
    	let each_value = /*levels*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(div, file$1, 13, 0, 317);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*handleStartGame, levels, i18, params*/ 15) {
    				each_value = /*levels*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('StartGame', slots, []);
    	let { params } = $$props;
    	let { settings } = $$props;
    	let { onChangePage } = $$props;
    	const levels = settings.getLevels();
    	const i18 = dict();

    	const handleStartGame = level => {
    		console.log(level);
    		settings.setSetting("level", level);
    		onChangePage("Board");
    	};

    	const writable_props = ['params', 'settings', 'onChangePage'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<StartGame> was created with unknown prop '${key}'`);
    	});

    	const click_handler = level => handleStartGame(level);

    	$$self.$$set = $$props => {
    		if ('params' in $$props) $$invalidate(0, params = $$props.params);
    		if ('settings' in $$props) $$invalidate(4, settings = $$props.settings);
    		if ('onChangePage' in $$props) $$invalidate(5, onChangePage = $$props.onChangePage);
    	};

    	$$self.$capture_state = () => ({
    		dict,
    		params,
    		settings,
    		onChangePage,
    		levels,
    		i18,
    		handleStartGame
    	});

    	$$self.$inject_state = $$props => {
    		if ('params' in $$props) $$invalidate(0, params = $$props.params);
    		if ('settings' in $$props) $$invalidate(4, settings = $$props.settings);
    		if ('onChangePage' in $$props) $$invalidate(5, onChangePage = $$props.onChangePage);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [params, levels, i18, handleStartGame, settings, onChangePage, click_handler];
    }

    class StartGame extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { params: 0, settings: 4, onChangePage: 5 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "StartGame",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*params*/ ctx[0] === undefined && !('params' in props)) {
    			console_1.warn("<StartGame> was created without expected prop 'params'");
    		}

    		if (/*settings*/ ctx[4] === undefined && !('settings' in props)) {
    			console_1.warn("<StartGame> was created without expected prop 'settings'");
    		}

    		if (/*onChangePage*/ ctx[5] === undefined && !('onChangePage' in props)) {
    			console_1.warn("<StartGame> was created without expected prop 'onChangePage'");
    		}
    	}

    	get params() {
    		throw new Error("<StartGame>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<StartGame>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get settings() {
    		throw new Error("<StartGame>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set settings(value) {
    		throw new Error("<StartGame>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onChangePage() {
    		throw new Error("<StartGame>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onChangePage(value) {
    		throw new Error("<StartGame>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.46.4 */
    const file = "src/App.svelte";

    // (29:1) {#if currentPage != "MainMenu"}
    function create_if_block_3(ctx) {
    	let button;
    	let div0;
    	let t;
    	let div1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			div0 = element("div");
    			t = space();
    			div1 = element("div");
    			attr_dev(div0, "class", "line svelte-vown9k");
    			add_location(div0, file, 33, 3, 934);
    			attr_dev(div1, "class", "line svelte-vown9k");
    			add_location(div1, file, 34, 3, 957);
    			attr_dev(button, "class", "button-back svelte-vown9k");
    			add_location(button, file, 29, 2, 860);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, div0);
    			append_dev(button, t);
    			append_dev(button, div1);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*handleBackPage*/ ctx[5], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(29:1) {#if currentPage != \\\"MainMenu\\\"}",
    		ctx
    	});

    	return block;
    }

    // (43:1) {#if currentPage == "MainMenu"}
    function create_if_block_2(ctx) {
    	let mainmenu;
    	let current;

    	mainmenu = new Menu({
    			props: {
    				props: /*props*/ ctx[1],
    				onChangePage: /*handleChangePage*/ ctx[4]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(mainmenu.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(mainmenu, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const mainmenu_changes = {};
    			if (dirty & /*props*/ 2) mainmenu_changes.props = /*props*/ ctx[1];
    			mainmenu.$set(mainmenu_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(mainmenu.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(mainmenu.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(mainmenu, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(43:1) {#if currentPage == \\\"MainMenu\\\"}",
    		ctx
    	});

    	return block;
    }

    // (47:1) {#if currentPage == "LevelMenu"}
    function create_if_block_1(ctx) {
    	let levelmenu;
    	let current;

    	levelmenu = new StartGame({
    			props: {
    				props: /*props*/ ctx[1],
    				settings: /*settings*/ ctx[3],
    				params: /*props*/ ctx[1],
    				onChangePage: /*handleChangePage*/ ctx[4]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(levelmenu.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(levelmenu, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const levelmenu_changes = {};
    			if (dirty & /*props*/ 2) levelmenu_changes.props = /*props*/ ctx[1];
    			if (dirty & /*props*/ 2) levelmenu_changes.params = /*props*/ ctx[1];
    			levelmenu.$set(levelmenu_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(levelmenu.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(levelmenu.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(levelmenu, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(47:1) {#if currentPage == \\\"LevelMenu\\\"}",
    		ctx
    	});

    	return block;
    }

    // (56:1) {#if currentPage == "Board"}
    function create_if_block(ctx) {
    	let board;
    	let current;

    	board = new Board_1({
    			props: { settings: /*settings*/ ctx[3] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(board.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(board, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(board.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(board.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(board, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(56:1) {#if currentPage == \\\"Board\\\"}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let t0;
    	let settingspage;
    	let t1;
    	let h1;
    	let t2;
    	let t3;
    	let t4;
    	let t5;
    	let current;
    	let if_block0 = /*currentPage*/ ctx[2] != "MainMenu" && create_if_block_3(ctx);

    	settingspage = new Settings({
    			props: { settings: /*settings*/ ctx[3] },
    			$$inline: true
    		});

    	let if_block1 = /*currentPage*/ ctx[2] == "MainMenu" && create_if_block_2(ctx);
    	let if_block2 = /*currentPage*/ ctx[2] == "LevelMenu" && create_if_block_1(ctx);
    	let if_block3 = /*currentPage*/ ctx[2] == "Board" && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			create_component(settingspage.$$.fragment);
    			t1 = space();
    			h1 = element("h1");
    			t2 = text(/*name*/ ctx[0]);
    			t3 = space();
    			if (if_block1) if_block1.c();
    			t4 = space();
    			if (if_block2) if_block2.c();
    			t5 = space();
    			if (if_block3) if_block3.c();
    			attr_dev(h1, "class", "logo svelte-vown9k");
    			add_location(h1, file, 40, 1, 1028);
    			attr_dev(main, "class", "svelte-vown9k");
    			add_location(main, file, 27, 0, 818);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			if (if_block0) if_block0.m(main, null);
    			append_dev(main, t0);
    			mount_component(settingspage, main, null);
    			append_dev(main, t1);
    			append_dev(main, h1);
    			append_dev(h1, t2);
    			append_dev(main, t3);
    			if (if_block1) if_block1.m(main, null);
    			append_dev(main, t4);
    			if (if_block2) if_block2.m(main, null);
    			append_dev(main, t5);
    			if (if_block3) if_block3.m(main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*currentPage*/ ctx[2] != "MainMenu") {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_3(ctx);
    					if_block0.c();
    					if_block0.m(main, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (!current || dirty & /*name*/ 1) set_data_dev(t2, /*name*/ ctx[0]);

    			if (/*currentPage*/ ctx[2] == "MainMenu") {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*currentPage*/ 4) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_2(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(main, t4);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (/*currentPage*/ ctx[2] == "LevelMenu") {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty & /*currentPage*/ 4) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_1(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(main, t5);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}

    			if (/*currentPage*/ ctx[2] == "Board") {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);

    					if (dirty & /*currentPage*/ 4) {
    						transition_in(if_block3, 1);
    					}
    				} else {
    					if_block3 = create_if_block(ctx);
    					if_block3.c();
    					transition_in(if_block3, 1);
    					if_block3.m(main, null);
    				}
    			} else if (if_block3) {
    				group_outros();

    				transition_out(if_block3, 1, 1, () => {
    					if_block3 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(settingspage.$$.fragment, local);
    			transition_in(if_block1);
    			transition_in(if_block2);
    			transition_in(if_block3);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(settingspage.$$.fragment, local);
    			transition_out(if_block1);
    			transition_out(if_block2);
    			transition_out(if_block3);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (if_block0) if_block0.d();
    			destroy_component(settingspage);
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let { name } = $$props;
    	let props;
    	const settings = new Settings$1();
    	settings.settings.subscribe(s => $$invalidate(1, props = s));
    	let currentLevel = settings.getLevel();
    	let currentPage = "MainMenu";

    	const handleChangePage = nextPage => {
    		$$invalidate(2, currentPage = nextPage);
    	};

    	const handleBackPage = () => {
    		switch (currentPage) {
    			case "LevelMenu":
    				handleChangePage("MainMenu");
    				break;
    			case "Board":
    				handleChangePage("LevelMenu");
    				break;
    		}
    	};

    	const writable_props = ['name'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    	};

    	$$self.$capture_state = () => ({
    		Settings: Settings$1,
    		Board: Board_1,
    		SettingsPage: Settings,
    		MainMenu: Menu,
    		LevelMenu: StartGame,
    		name,
    		props,
    		settings,
    		currentLevel,
    		currentPage,
    		handleChangePage,
    		handleBackPage
    	});

    	$$self.$inject_state = $$props => {
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    		if ('props' in $$props) $$invalidate(1, props = $$props.props);
    		if ('currentLevel' in $$props) currentLevel = $$props.currentLevel;
    		if ('currentPage' in $$props) $$invalidate(2, currentPage = $$props.currentPage);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [name, props, currentPage, settings, handleChangePage, handleBackPage];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { name: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[0] === undefined && !('name' in props)) {
    			console.warn("<App> was created without expected prop 'name'");
    		}
    	}

    	get name() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const app = new App({
        target: document.body,
        props: {
            name: 'sud!ku',
        }
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
