// Type definitions for ejs.js v2.3.3 
2 // Project: http://ejs.co/ 
3 // Definitions by: Ben Liddicott <https://github.com/benliddicott/DefinitelyTyped> 
4 // Definitions: https://github.com/borisyankov/DefinitelyTyped 
5 
 
6 
 
7 declare module "ejs" { 
8     namespace Ejs { 
9         type Data = { [name: string]: any }; 
10         type Dependencies = string[]; 
11         var cache: Cache; 
12         var localsName: string; 
13         function resolveInclude(name: string, filename: string): string; 
14         function compile(template: string, opts?: Options): (TemplateFunction); 
15         function render(template: string, data?: Data, opts?: Options): string; 
16         function renderFile(path: string, data?: Data, opts?: Options, cb?: Function): any;// TODO RenderFileCallback return type 
17         function clearCache(): any; 
18 
 
19         function TemplateFunction(data: Data): any; 
20         interface TemplateFunction { 
21             dependencies: Dependencies; 
22         } 
23         interface Options { 
24             cache?: any; 
25             filename?: string; 
26             context?: any; 
27             compileDebug?: boolean; 
28             client?: boolean; 
29             delimiter?: string; 
30             debug?: any; 
31             _with?: boolean; 
32         } 
33         class Template { 
34             constructor(text: string, opts: Options); 
35             opts: Options; 
36             templateText: string; 
37             mode: string; 
38             truncate: boolean; 
39             currentLine: number; 
40             source: string; 
41             dependencies: Dependencies; 
42             createRegex(): RegExp; 
43             compile(): TemplateFunction; 
44             generateSource(): any; 
45             parseTemplateText(): string[]; 
46             scanLine(line: string): any; 
47 
 
48         } 
49         module Template { 
50             interface MODES { 
51                 EVAL: string; 
52                 ESCAPED: string; 
53                 RAW: string; 
54                 COMMENT: string; 
55                 LITERAL: string; 
56             } 
57         } 
58         function escapeRegexChars(s: string): string; 
59         function escapeXML(markup: string): string; 
60         function shallowCopy<T1>(to: T1, fro: any): T1; 
61         interface Cache { 
62             _data: { [name: string]: any }; 
63             set(key: string, val: any): any; 
64             get(key: string): any; 
65         } 
66         var cache: Cache; 
67         function resolve(from1: string, to: string): string; 
68         function resolve(from1: string, from2: string, to: string): string; 
69         function resolve(from1: string, from2: string, from3: string, to: string): string; 
70         function resolve(from1: string, from2: string, from3: string, from4: string, to: string): string; 
71         function resolve(from1: string, from2: string, from3: string, from4: string, from5: string, to: string): string; 
72         function resolve(from1: string, from2: string, from3: string, from4: string, from5: string, from6: string, to: string): string; 
73         function resolve(from1: string, from2: string, from3: string, from4: string, from5: string, from6: string, from7: string, to: string): string; 
74         function resolve(from1: string, from2: string, from3: string, from4: string, from5: string, from6: string, from7: string, from8: string, to: string): string; 
75         function resolve(from1: string, from2: string, from3: string, from4: string, from5: string, from6: string, from7: string, from8: string, from9: string, to: string): string; 
76         function resolve(...args: string[]): string; 
77         function normalize(path: string): string; 
78         function isAbsolute(path: string): boolean; 
79         function join(...args: string[]): string; 
80         function relative(from: string, to: string): string; 
81         var sep: string; 
82         var delimiter: string; 
83         function dirname(path: string): string; 
84         function basename(path: string): string; 
85         function extname(path: string): string; 
86         function filter(xs: any, f: any): any; // TODO WHUT? 
87 
 
88 
 
89     } 
90     export = Ejs; 
91 }