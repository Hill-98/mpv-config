export function absolute_path(path: string): string;

export function arguments2array(args: object): any[];

export function default_value(value: any, default_value: any): any;

export function detect_os(): 'linux' | 'macos' | 'windows' | undefined;

export function empty(value: any): boolean;

export function dir_exist(dir: string): boolean;

export function file_exist(file: string): boolean;

export function read_file_lines(file: string, ignore_comments?: boolean): string[] | undefined;
