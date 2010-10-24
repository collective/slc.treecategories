/*global SLC_TREECATEGORIES, $ */
"use strict";
SLC_TREECATEGORIES = {
    controllers : {},
    trees : {},
    initialized : {},
    exception : function(name, message){
        throw {
            name: name,
            message: message,
            toString: function() {
                return this.name + ': ' + this.message;
            }
        };
    },
    reset : function(){
        this.controllers = {};
        this.trees = {};
    }
};
// Return a Controller registered for *html_input_id*
// if no controller registered yet, register it

SLC_TREECATEGORIES.getController = function (init_params) {
    // The controller
    var retval = SLC_TREECATEGORIES.controllers[init_params.fieldName];
    if(retval !== undefined){
        return retval;
    }
    var actives = [];
    retval = {};
    // create private Variables
    var options = ['html_input_id', 'fieldName', 'vocabulary_url', 'tree_wait', 'tree_error'];
    var i;
    for(i = 0;i<options.length;i+=1){
        retval[options[i]] = init_params[options[i]];
    }
    retval.debugLevel = 2;
    // Check preconditions
    if(retval.html_input_id === undefined){
        throw SLC_TREECATEGORIES.exception('SETUP', "treecategories set up without html input id");

    }
    if(retval.vocabulary_url === undefined){
        throw SLC_TREECATEGORIES.exception('SETUP', "treecategories set up without vocabulary url");
    }

    if(retval.fieldName === undefined){
        throw SLC_TREECATEGORIES.exception('SETUP', 'treecategories set up without fieldName');
    }

    SLC_TREECATEGORIES.controllers[init_params.fieldName] = retval;

    retval.addActive = function (tree) {
        if(tree.length === undefined){
            tree = [tree];
        }
        var i;
        for(i=0;i<tree.length;i+=1){
            actives.push(tree[i]);
        }
    };

    retval.resetActive = function () {
        actives = [];
    };

    function groupOrSingleAction(tree, mthd){
        var i;
        var treeIsActive;
        for(i = 0;i<actives.length;i+=1){
            if(actives[i] === tree){
                treeIsActive = true;
                break;
            }
        }
        if(treeIsActive){
            $(actives).each(function (){
                mthd.apply(this);
            });
        }else{
            mthd.apply(tree);
        }
    }

    retval.addCategory = function (tree, id) {
        groupOrSingleAction(tree, function(){
            this.addCategory(id);
        });
    };
    retval.removeCategory = function (tree, id) {
        groupOrSingleAction(tree, function(){
            this.removeCategory(id);
        });
    };

    //
    // ---- Tree code
    //
    // Method to create and store Tree objects
    retval.addTreeObjects = function(elems){
        if (elems.length === 0){
            SLC_TREECATEGORIES.exception('SETUP', 'Trying to set up slc.treecategories, but no real content to hook into given');
        }
        var i;
        for(i=0;i<elems.length;i+=1){
            var elem = elems[i];
            if(elem.id === ''){
                throw SLC_TREECATEGORIES.exception('SETUP', 'HTML container for tree data must have an unique id');
            }
        }
        var this_controller = this;
        return $(elems).each(function () {
            var that = this;
            var tree = {
                idPrefix: this.id
            };

            var ajax = $(this).find('input.ajax_url');
            if(ajax[0] === undefined){
                SLC_TREECATEGORIES.exception('SETUP', "HTML must contain input.ajax_url");
            }
            tree.ajax_url = ajax[0].value;


            tree.specificIdBuilder = function (id) {
                if(id.slice(0, tree.idPrefix.length) !== tree.idPrefix){
                    return tree.idPrefix + '_' + id;
                }
                return id;
            };

            tree.commonIdBuilder = function (id) {
                if(id.slice(0, tree.idPrefix.length) === tree.idPrefix){
                    return id.slice(tree.idPrefix.length + 1);
                }
                return id;
            };

            tree.getTreeNode = function closure (id) {
                var dynatree;
                return function () {
                    if(dynatree === undefined){
                        dynatree = $(that).find('.tree').dynatree('getTree');
                    }
                    if(dynatree === undefined){
                        return undefined;
                    }
                    return dynatree.getNodeByKey(id);
                }();
            };

            tree.addCategory = function (id) {
                var specificId = tree.specificIdBuilder(id);
                var items = $(that).find('.activator, .items');
                var i;
                for(i=0;i<items.length;i+=1){
                    if(items[i].id === specificId){
                        return;
                    }
                }
                var successMthd = function(data){
                    var clone = $(items[0]).clone();
                    clone.removeClass('activator');
                    clone.addClass('items');
                    clone.text(data);
                    clone[0].id = specificId;
                    $(items[items.size() - 1]).after(clone);
                    tree.addRemoveButton();
                };
                if(tree.ajax_url){
                    $.post(tree.ajax_url, {
                        add: id,
                        field: this_controller.fieldName
                    }, successMthd);
                } else {
                    successMthd(id);
                }
            };

            tree.removeCategory = function (id) {
                var specificId = tree.specificIdBuilder(id);
                $(that).find('.items').filter(function (){
                    return this.id === specificId;
                }).remove();
                var treeNode = tree.getTreeNode(id);
                if(treeNode !== undefined && treeNode !== null){
                    treeNode.select(false);
                }
                if(tree.ajax_url !== ''){
                    $.post(tree.ajax_url, {
                        remove: id,
                        field: this_controller.fieldName
                    });
                }
            };

            tree.addRemoveButton = function () {
                $(that).find('.items').each(function () {
                    var jq_this = $(this);
                    if(jq_this.find('img.remove').length === 0){
                        $(this).prepend('<img src="delete_icon.gif" title="Click here to delete" class="remove">');
                        $(this).find('img').click(function  () {
                            var commonId = tree.commonIdBuilder(jq_this[0].id);
                            this_controller.removeCategory(tree, commonId);
                        });
                    }
                });
            };

            tree.toggleActive = function (flag, dtnode) {
                var id = dtnode.data.key;
                if(flag) {
                    this_controller.addCategory(tree, id);
                }else{
                    this_controller.removeCategory(tree, id);
                }
            };

            tree.isActive = function(id) {
                var specificId = tree.specificIdBuilder(id);
                return $(that).find('#' + specificId).length > 0;
            };

            tree.dynatree_loaded = function () {
                var dyna = $(that).find('.tree').dynatree('getTree');
                $(that).find('.items').each(function () {
                    var id = tree.commonIdBuilder(this.id);
                    var node = dyna.selectKey(id, true);
                    if (node !== null){
                        node.makeVisible();
                    }
                });
            };
            tree.getDynatreeOptions = function closure (){
                var this_tree = this;
                return function (){
                    return {
                        persistent: false,
                        initAjax: {
                            url: this_controller.vocabulary_url,
                            success: this_tree.dynatree_loaded
                        },
                        onSelect: this_tree.toggleActive,
                        idPrefix: this_tree.idPrefix,
                        debugLevel: this_controller.debuglevel,
                        imagePath: '../skins/jquery.dynatree',
                        checkbox: true,
                        strings: {
                            loading: this_controller.tree_wait,
                            loadError: this_controller.tree_error
                        }
                    };
                }();
            };
            tree.init = function closure (){
                var this_tree = this;
                var jq_that = $(that);
                var activator;
                var dynatree;
                var ajax_url;
                return function (){
                    var dynatree_hook, options;
                    activator = jq_that.find('.activator');
                    if (activator[0] === undefined){
                        SLC_TREECATEGORIES.exception('SETUP', 'HTML must contain .activator');
                    }
                    dynatree_hook = jq_that.find('.tree');
                    activator.toggle(function () {
                        if(dynatree === undefined){
                            options = tree.getDynatreeOptions();
                            dynatree = dynatree_hook.dynatree(options);
                        }
                        dynatree_hook.show();
                    }, function () {
                        dynatree_hook.hide();
                    });

                    if (dynatree_hook[0] === undefined){
                        SLC_TREECATEGORIES.exception('SETUP', "HTML must contain .tree");
                    }
                    jq_that.find('.items').each(function () {
                        this_tree.addRemoveButton();
                    });
                }();
            };
            tree.init();
            SLC_TREECATEGORIES.trees[that.id] = tree;
        });
    };
    return retval;
};

// Return the tree object for *elem* and *html_input_id*
// Return undefined if no tree was generated
// tree objects are created by registering elements
// with a controller
SLC_TREECATEGORIES.getTrees = function (elem, fieldName) {
    if(elem.map === undefined){
        elem = $(elem);
    }
    return elem.map(function () {
        return SLC_TREECATEGORIES.trees[this.id];
    });
};
