/*global SLC_TREECATEGORIES, $ */
"use strict";
SLC_TREECATEGORIES = {
    controllers : {},
    trees : {},
    exception : function(name, message){
        //throw message;
        throw {
            name: name,
            message: message
        };
    },
    reset : function(){
        this.controllers = {};
        this.trees = {};
    }
};
// Return a Controller registered for *variable*
// if no controller registered yet, register it

SLC_TREECATEGORIES.getController = function (init_params) {
    // The controller
    var retval = SLC_TREECATEGORIES.controllers[init_params.variable];
    if(retval !== undefined){
        return retval;
    }
    var actives = [];
    retval = {};
    // create private Variables
    var options = ['variable', 'vocabulary_url', 'tree_wait', 'tree_error'];
    var i;
    for(i = 0;i<options.length;i+=1){
        retval[options[i]] = init_params[options[i]];
    }
    retval.debugLevel = 2;
    // Check preconditions
    if(retval.variable === undefined){
        throw SLC_TREECATEGORIES.exception('SETUP', "treecategories set up without variable");

    }
    if(retval.vocabulary_url === undefined){
        throw SLC_TREECATEGORIES.exception('SETUP', "treecategories set up without vocabulary url");
    }

    SLC_TREECATEGORIES.controllers[init_params.variable] = retval;

    retval.addActive = function (tree) {
        actives.push(tree);
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
    }
    retval.removeCategory = function (tree, id) {
        groupOrSingleAction(tree, function(){
            this.removeCategory(id);
        });
    }

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
        SLC_TREECATEGORIES.trees[this_controller.variable] = 
            SLC_TREECATEGORIES.trees[this_controller.variable] || {};
        return $(elems).each(function () {
            var that = this;
            var tree = {
                idPrefix: this.id
            };
            tree.idBuilder = function (id) {
                if(id.slice(0, tree.idPrefix.length) !== tree.idPrefix){
                    return tree.idPrefix + '_' + id;
                }
                return id;
            };

            tree.addCategory = function (id) {
                var fullId = tree.idBuilder(id);
                var items = $(that).find('.activator, .items');
                var clone = $(items[0]).clone();
                clone.removeClass('activator');
                clone.addClass('items');
                clone.text(id);
                clone[0].id = fullId;
                $(items[items.size() - 1]).after(clone);
                tree.addRemoveButton(fullId);
            };

            tree.removeCategory = function (id) {
                var fullId = tree.idBuilder(id);
                $(that).find('.items').filter(function (){
                    return this.id === fullId;
                }).remove();
            };

            tree.addRemoveButton = function (id) {
                $(that).find('#' + id).each(function () {
                    var jq_this = $(this);
                    if(jq_this.find('img.remove').length === 0){
                        $(this).prepend('<img src="delete_icon.gif" title="Click here to delete" class="remove">');
                        $(this).find('img').click(function  () {
                            tree.removeCategory(id);
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
                var fullId = tree.idBuilder(id);
                return $(that).find('#' + fullId).length > 0;
            };

            tree.dynatree_loaded = function () {return true;};
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
                        this_tree.addRemoveButton(this.id);
                    });
//                    dynatree = dynatree_hook.dynatree(options);
                }();
            };
            tree.init();
            SLC_TREECATEGORIES.trees[this_controller.variable][that.id] = tree;
        });
    };
    return retval;
};

// Return the tree object for *elem* and *variable*
// Return undefined if no tree was generated
// tree objects are created by registering elements
// with a controller
SLC_TREECATEGORIES.getTree = function (elem, variable) {
    if(elem.map === undefined){
        elem = $(elem);
    }
    return elem.map(function () {
        var tree = SLC_TREECATEGORIES.trees[variable] && 
            SLC_TREECATEGORIES.trees[variable][elem[0].id];
        return tree;
    });
};
