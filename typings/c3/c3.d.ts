// Type definitions for c3 v0.4.8
// Project: http://c3js.org/
// Definitions by: Tim Johnson https://github.com/tspec1
// Definitions: https://github.com/borisyankov/DefinitelyTyped 

///////////////////////////////////////////////////////////////////////////////
// c3 module (c3.js)
///////////////////////////////////////////////////////////////////////////////
declare module c3 {
    
    ///////////
    // c3Static
    ///////////
    export interface Ic3Static {
        /**
         * Use this function to generate a chart.
         *
         * @param options Options to configure chart display.
         */
        generate(options: IGenerateOptions): any;
    }

    export interface IGenerateOptions {
        /**
         * The CSS selector or the element which the chart will be set to. D3 selection object can be specified. 
         * If other chart is set already, it will be replaced with the new one (only one chart can be set in one element).
         */
        bindto: string;
        /**
         * Parse a JSON object for data. See also data.keys.
         */
        data: IDataOptions;
        axis: IAxisOptions;
        bar: IBarOptions;
        grid: IGridOptions;
        legend: ILegendOptions;
    }

    export interface IDataOptions {
        json?: Object;
        columns?: Array<any>;
        keys?: IKeysOptions;
        type: string;
        onclick?(color: string, data: any): any;
    }

    export interface IKeysOptions {
        x: string;
        value: Array<any>;
    }

    export interface IAxisOptions {
        x: IAxisXOptions;
        y?: IAxisYOptions;
    }

    export interface IAxisXOptions {
        type: string;
        categories: Array<string>;
    }

    export interface IAxisYOptions {
        type: string;
        categories: Array<string>;
    }

    export interface IBarOptions {
        width: IBarWidthOptions;
    }

    export interface IBarWidthOptions {
        ratio: number;
    }

    export interface IGridOptions {
        focus: IGridFocusOptions;
    }

    export interface IGridFocusOptions {
        show: boolean;
    }

    export interface ILegendOptions {
        show: boolean;
    }

}

declare var c3: c3.Ic3Static;

declare module 'c3' {
    export = c3;
}