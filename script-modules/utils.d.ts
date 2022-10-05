export function absolute_path(path: string): string;

export function arguments2array(args: object): any[];

export function default_value(value: any, default_value: any): any;

export function detect_os(): 'linux' | 'macos' | 'windows' | undefined;

export function dir_exist(dir: string): boolean;

export function empty(value: any): boolean;

export function file_exist(file: string): boolean;

export function format_windows_path(path: string, is_windows?: boolean): string;

export function read_file_lines(file: string, ignore_comments?: boolean): string[] | undefined;

export function string_format(str: string, ...args: string[]): string;
