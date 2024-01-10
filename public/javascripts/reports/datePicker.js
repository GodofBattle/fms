const DatePicker = function(_id, _options) {
    const id = _id;

    let options = {
        period: undefined,
        startDate: undefined,
        minDate: undefined,
        maxDate: undefined
    }
    options = _options;

    let input_inst = undefined;
    let picker_inst = undefined;
    
    let input_options = {
        format: 'yyyy/MM/dd HH:mm',
        messages: {
            'year': 'yyyy',
            'month': 'MM',
            'day': 'dd',
            'hour': 'HH',
            'minute': 'mm'
        },
        value: options.startDate ? options.startDate : new Date(),
        change: function() {
            if(picker_inst) {
                picker_inst.selectDate(this.value());
                picker_inst.date = this.value();
            }
        }
    };
    
    let picker_options = {
        language: 'kr',
        timepicker: true,
        navTitles: {
            days: '<i>yyyy</i>년 MM',
            months: '<i>yyyy</i>년',
            years: '<i>yyyy1</i>년 - <i>yyyy2</i>년'
        },
        toggleSelected: false,
        minutesStep: 60,
        maxMinutes: 0,
        keyboardNav: false,
        showEvent: 'focus',
        startDate: options.startDate ? options.startDate : new Date(),
        position: 'bottom center',
        onShow: function(inst, animationCompleted) {
            if(!animationCompleted && input_inst) {
                inst.selectDate(input_inst.value());
                inst.date = input_inst.value();
            }
        },
        onSelect: function(formattedDate, date, inst) {
            if(input_inst) {
                let new_date = date;
                switch (options.period) {
                    case 'day': {
                        const old_date = input_inst.value();
                        new_date = new Date(date.getFullYear(), date.getMonth(), date.getDate(), old_date.getHours(), old_date.getMinutes());
                        break;
                    }
                    case 'month': {
                        const old_date = input_inst.value();
                        let old_day = old_date.getDate();
                        switch(date.getMonth()) {
                            case 1: {
                                if(date.getFullYear() % 4 === 0 && old_day > 29) old_day = 29;
                                else if(old_day > 28) old_day = 28;
                                break;
                            }
                            case 3: case 5: case 8: case 10: {
                                if(old_day === 31) old_day = 30;
                                break;
                            }
                        }

                        new_date = new Date(date.getFullYear(), date.getMonth(), old_day, old_date.getHours(), old_date.getMinutes());
                        break;
                    }
                }
                
                input_inst.value(new_date);
            }
        }
    };

    function setPeriod(_period) {
        options.period = _period;
    }

    function changeOptions(_period) { 
        switch(_period) {
            case '5minute': set5MinuteOptions(); break;
            case 'hour': setHourOptions(); break;
            case 'day': setDayOptions(); break;
            case 'month': setMonthOptions(); break;
            case 'year': setYearOptions(); break;
        }
    }

    function set5MinuteOptions() {
        input_options.format = 'yyyy/MM/dd HH:mm';
        
        picker_options.timepicker = true;
        picker_options.minutesStep = 5;
        picker_options.maxMinutes = 55;
        picker_options.view = 'days';
        picker_options.minView = 'days';
    }

    function setHourOptions() {
        input_options.format = 'yyyy/MM/dd HH:00';

        picker_options.timepicker = true;
        picker_options.minutesStep = 60;
        picker_options.maxMinutes = 0;
        picker_options.view = 'days';
        picker_options.minView = 'days';
    }

    function setDayOptions() {
        input_options.format = 'yyyy/MM/dd';

        picker_options.timepicker = false;
        picker_options.view = 'days';
        picker_options.minView = 'days';
    }

    function setMonthOptions() {
        input_options.format = 'yyyy/MM';

        picker_options.timepicker = false;
        picker_options.view = 'months';
        picker_options.minView = 'months';
    }

    function setYearOptions() {
        input_options.format = 'yyyy';
        picker_options.timepicker = false;
        picker_options.view = 'years';
        picker_options.minView = 'years';
    }

    function createDatePicker() {
        changeOptions(options.period);

        input_inst = $(id).kendoDateInput(input_options).data('kendoDateInput');
        picker_inst = $(id).datepicker(picker_options).data('datepicker');
    }

    function reload() {
        input_inst.setOptions(input_options);
        
        picker_inst.destroy();
        picker_inst = $(id).datepicker(picker_options).data('datepicker');
    }

    function resetDate(_new_date) {
        picker_inst.date = _new_date;
        picker_inst.selectDate(_new_date);
    }

    function getDate() {
        return input_inst.value();
    }

    return {
        CreateDatePicker: function() { createDatePicker(); },
        Reload: function(_period) {
            setPeriod(_period);
            changeOptions(_period);
            reload();
        },
        ResetDate: function(_new_date) { resetDate(_new_date) },
        GetDate: function() { return getDate(); }
    }
}