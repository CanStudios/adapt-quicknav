
define([
    'core/js/adapt',
    'core/js/views/componentView',
    './tooltip'
], function(Adapt, ComponentView, Tooltip) {

    function getAttributes($node){
        var attrs = {};
        _.each($node[0].attributes, function (attribute) {
            attrs[attribute.name] = attribute.value;
        });
        return attrs;
    }

    var View = ComponentView.extend({
       
        className: "quicknav",

        events: {
            "click button": "onButtonClick",
            "mouseover button": "onButtonTooltip"
        },

        preRender: function() {

            _.bindAll(this, "postRender", "checkButtonStates");

            this.setCompletionStatus();

            this.listenTo(Adapt, "remove", this.remove);
            this.listenTo(this.model.getCurrentPage(), "change:_isComplete", this.onPageCompleted);

        },

        render: function() {

            var template = Handlebars.templates["quicknav"];
            var data = _.extend( this.model.toJSON(), { 
                _items: this.model.getNavigationData() 
            });

            this.$el.html(template(data));

            _.defer(this.postRender);

        },

        postRender: function() {

            this.checkButtonStates();
            this.setReadyStatus();
            
        },

        onPageCompleted: function() {

            _.defer(this.checkButtonStates);

        },

        checkButtonStates: function() {

            this.$("button").each(_.bind(function(index, item) {
                this.checkButtonState(item);
            }, this));

        },

        checkButtonState: function(button) {

            var $button = $(button);
            var id = $button.attr("data-id");
            var index = $button.attr("data-item-index");

            if (!id) return;

            // get the button data
            var items = this.model.getNavigationData();
            var data = items[index];

            // rerender the button
            var $buttonRendered = $(Handlebars.partials['quicknav-item'](data));
            if ($buttonRendered.length === 0) {
                $button.remove();
                return;
            }

            // get button attribute names from current and rerendered
            var renderedAttrs = getAttributes($buttonRendered);
            var attrs = getAttributes($button);
            var renderedAttrNames = _.keys(renderedAttrs);
            var attrNames = _.keys(attrs);

            // remove redundant attributes
            var removeAttrNames = _.difference(renderedAttrNames, attrNames);
            removeAttrNames.forEach(function(name) {
                $button.removeAtrr(name);
            });

            // update remaining attributes
            $button.attr(renderedAttrs);

            // update button text
            $button.html($buttonRendered.html());

        },

        onButtonClick: function(event) {

            var $target = $(event.currentTarget);
            var isLocked = $target.hasClass("locked");
            var isSelected = $target.hasClass("selected");
            
            if (isLocked || isSelected) return;

            var id = $target.attr("data-id");
            this.navigateTo(id);

        },

        onButtonTooltip: function(event) {

            var $target = $(event.currentTarget);
            var id = $target.attr("data-id");

            if (!id) {
                return;
            }

            // If tooltip isn't defined allow the event to propogate down to the document
            if (!$target.attr("tooltip")) {
                return;
            }

            // Don't allow event to propogate, to stop the document over events
            event.stopPropagation();

            // If this tooltip is already rendered then skip
            if (Adapt.tooltip) {

                var type = $target.attr("data-type");
                var index = $target.attr("data-index");
                var isCurrentTooltip = (Adapt.tooltip.type === type) && (Adapt.tooltip.index === index);
                
                if (isCurrentTooltip) {
                    return;
                }
                
            }

            var tooltip = new Tooltip({
                $target: $target,
                model: Adapt.findById(id)
            });

            this.$(".quicknav-inner").append(tooltip.$el);

        },

        navigateTo: function(id) {

            var isCourse = (id === Adapt.course.get("_id"));
            var hash = "#" + (isCourse ? "/" : "/id/" + id);

            Backbone.history.navigate(hash, { trigger:true, "replace": false });

        }

    });

    return View;

});
