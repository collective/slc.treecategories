/*jslint white: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, strict: true, newcap: true */
/*global jq */
"use strict";

function inline_tree_init() {
    if (self.inline_tree_initialised === true) {
        return;
    }
    self.inline_tree_initialised = true;

    // Javascript function for really adding a selected category to an object
    function addItems(objects, id, func) {
        jq.map(objects, function (o) {
            jq.post(o.ajax_url, {
                add: id,
                field: o.field
            }, function (data) {
                return func(data, o.list, o.base_id);
            });
        });
    }

    // Javascript function for really removing an unselected category from an
    // object
    function removeItems(objects, id, func) {
        jq.map(objects, function (object) {
            jq.post(object.ajax_url, {
                remove: id,
                field: object.field
            }, function (data) {
                return func(data, object.list, object.base_id);
            });
        });
    }

    // Category management, can be overwritten
    function getCategories() {
        return self._objects;
    }
    function addCategory(category) {
        self._objects = jq.merge(self._objects, jq.makeArray(category));
    }
    function resetCategories() {
        self._objects = jq.makeArray();
    }


    /* For each inline tree widget we find on the page */
    jq('.inline_tree').each(function (item) {

        this.addCategory = addCategory;
        this.getCategories = getCategories;
        this.resetCategories = resetCategories;
        this.resetCategories();
        var base_id = this.id.replace('.', '\\.').replace(':', '\\:');
        var fx = this.fx;
        if (!fx) {
            fx = {
                height: "toggle",
                duration: 200
            };
        }
        var inline_tree_this = this;
        var data_field = jq(this);
        var id_prefix = base_id + '-inline-';
        function jq_(suffix) {
            // find an object with the current base id and the specified suffix.
            return jq(("#" + base_id + '_' + suffix));
        }
        var fieldName = jq_('fieldName').val();

        /* add event handlers to the remove parts */
        function loadRemoveButtons(list, base_id) {
            /* When one clicks on the remove button, submit a request
             * to delete the category from the object. After this finished
             * successfully, remove the category from the view
             */
            list.children().children('img').filter(function () {
                var className = this.className;
                return className.substring(className.length - 'remove'.length) === 'remove' && !jq(this).data('click_added');
            }).each(function () {
                jq(this).click(function () {
                    var item_to_remove = this;
                    var li = jq(this).parent()[0];
                    var liid = li.id.substring("liid_".length + base_id.replace('\\.', '.').replace('\\:', ':').length);
                    if (!jq.map(inline_tree_this.getCategories(), function (object) {
                        return object.field;
                    }).filter(function () {
                        return 'subcategory' === this;
                    })) {
/*                    }).contains(fieldName)) { */
                        inline_tree_this.addCategory({
                            ajax_url: jq_('ajax_url').val(),
                            field: fieldName,
                            list: data_field,
                            base_id : base_id
                        });
                    }
                    removeItems(inline_tree_this.getCategories(), liid, function (data, list, base_id) {
                        jq('#liid_' + base_id + liid).remove();
                        jq_('inlinetree').dynatree('getTree').selectKey(liid, false);
                    });
                });
                jq(this).data('click_added', 1);
            });
        }

        /* Build the tree */
        loadRemoveButtons(data_field, base_id);
        function resetActivatorButtons(func) {
            return function () {
                var activator = this;
                jq(".tree").each(function () {
                    if (this === activator) {
                    }
                    else {
                        jq(this).hide();
                    }
                });
                func();
            };
        }
        jq_("activator").toggle(resetActivatorButtons(function () {
            jq_("inlinetree").dynatree({
                persist: false,
                initAjax: {
                    url: jq_('vocabulary_url').val() + '/json',
                    data: {'_': '1'},
                    success: function (reload, isError) {
                        jq('#' + base_id + ' li').each(function () {
                            var id = this.id.substring(5 + base_id.replace('\\.', '.').replace('\\:', ':').length);
                            if (id) {
                                var key = jq_('inlinetree').dynatree('getTree').selectKey(id, true);
                                if (key !== null) {
                                    key.makeVisible();
                                }
                            }
                        });
                        self['initialised_' + base_id] = true;
                    }
                },
                onSelect: function (flag, dtnode) {
                    if (self['initialised_' + base_id] !== true) {
                        return;
                    }
                    if (flag) {
                        var id = dtnode.data.key;
                        addItems(inline_tree_this.getCategories(), id, function (data, list, base_id) {
                            jq(list.children()[0]).after('<li id="liid_' +
                            base_id.replace('\\.', '.').replace('\\:', ':') +
                            id +
                            '"><img src="delete_icon.gif" title="Click here to delete" class="remove ' +
                            base_id.replace('\\.', '.').replace('\\:', ':') +
                            '_remove" />' +
                            data +
                            '</li>');
                            loadRemoveButtons(list, base_id);
                        });
                    }
                    else {
                        removeItems(inline_tree_this.getCategories(), dtnode.data.key, function (data, list, base_id) {
                            jq('#liid_' + base_id + dtnode.data.key).remove();
                        });
                    }
                },
                idPrefix: id_prefix,
                fx: fx,
                debugLevel: 0,
                checkbox: true,
                strings: {
                    loading: jq(".tree_wait").text(),
                    loadError: jq(".tree_error").text()
                }
            });
            inline_tree_this.resetCategories();
            inline_tree_this.addCategory({
                ajax_url: jq_('ajax_url').val(),
                field: fieldName,
                list: data_field,
                base_id : base_id
            });
            jq_('inlinetree').show();
        }), resetActivatorButtons(function () {
            inline_tree_this.resetCategories();
            jq_('inlinetree').hide();
        }));
    });
}

function portlet_tree_init() {
    if (self.tree_portlet_initialised === true) {
        return;
    }
    self.tree_portlet_initialised = true;

    jq('.tree_portlet_category').each(function (item) {
        var base_id = this.id;
        var fx = this.fx;
        if (!fx) {
            fx = {
                height: "toggle",
                duration: 200
            };
        }
        var data_field = jq(this);
        function jq_(suffix) {
            // find an object with the current base id and the specified suffix.
            return jq("#" + base_id + '_' + suffix);
        }
        function toggleHighlight(element) {
            var category = element.parents('.tree')[0].id.split('_')[0];
            jq('.categorizerForm .category.' + category).filter(function () {
                return jq(this).parent().children('input:checked').length;
            }).each(function () {
                jq(this).parent().toggleClass('error');
            });
        }
        function makeDraggable(selector) {
            jq(selector).each(function () {
                this.toggleHighlight = function () {
                    jq(selector).each(function () {
                        toggleHighlight(jq(this));
                    });
                };
            });
            jq(selector).draggable({
                'revert': true,
                start: function (event, ui) {
                    toggleHighlight(ui.helper);
                },
                stop: function (event, ui) {
                    toggleHighlight(ui.helper);
                }
            });
        }
        jq_("tree").dynatree({
            persist: false,
            onExpand: function (node) {
                makeDraggable(this);
            },
            initAjax: {
                url: jq_('vocabulary_url').val() + '/json',
                success: function (reload, isError) {
                    makeDraggable('#' + base_id + '_tree .ui-dynatree-container a');
                }
            },
            fx: fx,
            debugLevel: 0,
            strings: {
                loading: jq(".tree_wait").text(),
                loadError: jq(".tree_error").text()
            }
        });
    });
}

function tree_init() {
    // each select input item that belongs to this widget contains the
    // state of the widget. We look for that input item to get the state, and
    // all configuration for the dynamic elements. the base id for each
    // element, for example. Interaction with plone is done via the select box
    // only!
    if (self.tree_initialised === true) {
        return;
    }
    self.tree_initialised = true;
    jq('.tree_values').each(function (item) {
        var base_id = this.id;
        var fx = this.fx;
        if (!fx) {
            fx = {
                height: "toggle",
                duration: 200
            };
        }
        // for some reason the select element is not
        // wrapped by jquery, we do it here
        var data_field = jq(this);
        function jq_(suffix) {
            // find an object with the current base id and the specified suffix.
            return jq("#" + base_id + '_' + suffix);
        }
        function initTree(event) {
            // update the trees. This method is the preferred way to update the tree contents
            // One tree shall only show the unselected
            // methods, the other only the selected
            // We build one filter here, that can be
            // used for both xmlhttprequests
            var filters = "&key_limiter:list=";
            data_field.children().each(function (i) {
                filters += '&key_limiter:list=' + this.value;
            });
            filters += '&full_text_filter=' + jq_('filter').val();
            // Both trees are initialized similary.
            // The information for retrieving the valid
            // options is stored in the html,
            // the parameters are dynamically set up
            // here. the can_have tree shows the
            // possible items, thus the item filter is
            // set to reverse.
            // the onActivate event is fired when one
            // clicks on an element.
            // The event handler updates only the select
            // input element, and then triggers
            // a change event on the select input
            // element. This in turns calls updateTree
            // which updates the tree.
            if (jq_('can_have').dynatree('getRoot')) {
                jq_('can_have').dynatree('getRoot').removeChildren();
                jq_('has').dynatree('getRoot').removeChildren();
            }
            jq_("can_have").dynatree({
                onActivate: function (dtnode) {
                    data_field.append(new Option(dtnode.data.title, dtnode.data.key, true));
                    dtnode.visit(function (node, data) {
                        jq('#' + base_id + ' option[value=' + node.data.key + ']').remove();
                    }, false);
                    data_field.change();
                },
                persist: false,
                initAjax: {
                    url: jq_('vocabulary_url').val() + '/json?1=1' + filters + '&invert_key_limiter=True'
                },
                fx: fx,
                debugLevel: 0,
                strings: {
                    loading: jq(".tree_wait").text(),
                    loadError: jq(".tree_error").text()
                }
            });
            jq_("has").dynatree({
                onActivate: function (dtnode) {
                    dtnode.toDict(true, function (dict) {
                        jq('#' + base_id + ' option[value=' + dict.key + ']').remove();
                    });
                    data_field.change();
                },
                persist: false,
                initAjax: {
                    url: jq_('vocabulary_url').val() + '/json?1=1' + filters
                },
                fx: fx,
                debugLevel: 0,
                strings: {
                    loading: jq(".tree_wait").text(),
                    loadError: jq(".tree_error").text()
                }
            });
        }
        function updateTree(event) {
            var filters = "&key_limiter:list=";
            data_field.children().each(function (i) {
                filters += '&key_limiter:list=' + this.value;
            });
            filters += '&full_text_filter=' + jq_('filter').val();

            function _updateTree(item, url) {
                jQuery.getJSON(url, function (data) {
                    item.dynatree('getRoot').removeChildren();
                    item.dynatree('getRoot').append(data);
                });
            }
            _updateTree(jq_("has"), jq_('vocabulary_url').val() + '/json?1=1' + filters);
            _updateTree(jq_("can_have"), jq_('vocabulary_url').val() + '/json?1=1' + filters + '&invert_key_limiter=True');
        }
        data_field.change(updateTree);
        initTree();
        // Each tree item has a filter that acts without
        // submit button. It waits 500ms before doing
        // the actual filtering
        var treesearch_timerid = 'None';
        jq_('filter').bind('keypress', function (e) {
            if (treesearch_timerid !== 'None') {
                clearTimeout(treesearch_timerid);
            }
            treesearch_timerid = setTimeout(updateTree, 500);
        });
    });
}
