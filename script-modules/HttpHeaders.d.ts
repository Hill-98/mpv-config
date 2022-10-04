interface Header {
    name: string;
    value: string;
    original: string;
}

interface globalHttpHeaders {
    add(name: string, value: string): boolean;

    clear(): boolean;

    del(name: string, value?: string): boolean;

    get(name: string): Header[];

    has(name: string): boolean;

    list(name: string): Header[];
}

declare class HttpHeaders {
    constructor();

    add(name: string, value: string): boolean;

    clear(): boolean;

    del(name: string): boolean;

    get(name: string): Omit<Header, 'original'>;

    has(name: string): boolean;

    list(name: string): Omit<Header, 'original'>[];

    static global: globalHttpHeaders;

    static parse(header: string): Header;
}

export = HttpHeaders;
