SNQL.macrosDefaults = (function () {

    const DEFAULTS = {
        today: {
            name: "today",
            scope: "value",
            label: "Today",
            display: "today",
            template: "ONToday@javascript:gs.beginningOfToday()@javascript:gs.endOfToday()",
            appliesTo: {
                type: ["glide_date", "glide_date_time"]
            }
        },

        yesterday: {
            name: "yesterday",
            scope: "value",
            label: "Yesterday",
            display: "yesterday",
            template: "ONYesterday@javascript:gs.beginningOfYesterday()@javascript:gs.endOfYesterday()",
            appliesTo: {
                type: ["glide_date", "glide_date_time"]
            }
        },

        this_week: {
            name: "this_week",
            scope: "value",
            label: "This week",
            display: "this_week",
            template: "ONThis Week@javascript:gs.beginningOfThisWeek()@javascript:gs.endOfThisWeek()",
            appliesTo: {
                type: ["glide_date", "glide_date_time"]
            }
        },

        this_month: {
            name: "this_month",
            scope: "value",
            label: "This month",
            display: "this_month",
            template: "ONThis Month@javascript:gs.beginningOfThisMonth()@javascript:gs.endOfThisMonth()",
            appliesTo: {
                type: ["glide_date", "glide_date_time"]
            }
        },

        me: {
            name: "me",
            scope: "value",
            label: "Me",
            display: "me",
            template: "javascript:gs.getUserID()",
            appliesTo: {
                reference: ["sys_user"]
            }
        },
        
        me_name: {
            name: "me_name",
            scope: "value",
            label: "My username",
            display: "me_name",
            template: "javascript:gs.getUserName()"
        },

        me_today: {
            name: "me_today",
            scope: "where",
            label: "My records created today",
            display: "me_today",
            template: "sys_created_on = today AND sys_created_by = me_name",
            requires: {
                fields: ['sys_created_on', 'sys_created_by']
            }
        }
    };

    function register() {
        const r = SNQL.macrosRegistry;

        Object.values(DEFAULTS).forEach(def => {
            r.define({
                ...def,
                compile(ctx) {
                    return this.template;
                }
            });
        });
    }

    function get(name) {
        const def = DEFAULTS[name];
        if (!def) return null;

        return {
            ...def,
            compile(ctx) {
                return this.template;
            }
        };
    }

    function list() {
        return Object.values(DEFAULTS);
    }

    return {
        register,
        get,
        list
    };

})();
