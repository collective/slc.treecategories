/*global module, test, expect, equals, SLC_TREECATEGORIES, same, ok $ */
module('tree', {
      setup: function () {}
    , teardown: function () {
    }
});

var ctrlMaker = function (fieldName, vocab_url, html_input_id, treewait, treeerror){
    if (vocab_url === undefined){
        vocab_url = 'json_example';
    }
    if (html_input_id === undefined){
        html_input_id = "ignore";
    }
    return SLC_TREECATEGORIES.getController({html_input_id : html_input_id,
                                             vocabulary_url: vocab_url,
                                             fieldName: fieldName,
                                             tree_wait: treewait,
                                             tree_error: treeerror});};
test('controller failureInit', function() {
    expect(9);
    function except(fieldName, vocab_url, html_input_id, msg){
        var excepted;
        try{
            SLC_TREECATEGORIES.getController({
                html_input_id: html_input_id, 
                vocabulary_url: vocab_url,
                fieldName: fieldName});
        } catch (e) {
            equals(e.name, 'SETUP');
            equals(e.message, msg);
            excepted = true;
        }
        equals(excepted, true);
    }
    except(undefined, 'ignore', 'ignore', 'treecategories set up without fieldName');
    except('ignore', undefined, 'ignore', 'treecategories set up without vocabulary url');
    except('ignore', 'ignore', undefined, 'treecategories set up without html input id');
});

test('controller init', function() {
    expect(2);
    var controller1 = ctrlMaker('var1');
    var controller2 = ctrlMaker('var1');
    var controller3 = ctrlMaker('var2');
    same(controller1, controller2, "We must get the same instance");
    equals(false, controller2 === controller3, "Different fieldName, must result in different controller");
});

test('controller failedRegistrations', function () {
    expect(15);
    var controller = ctrlMaker('var1');
    function except(path, msg){
        var excepted = false;
        try{
            controller.addTreeObjects($(path));
        }catch (e) {
            equals(e.name, 'SETUP');
            equals(e.message, msg);
            excepted = true;
        }
        equals(excepted, true, 'No exception thrown for: ' + path + ' That must not happen!');
    }
    var excepted = false;
    except('.example1', 'HTML must contain .tree');
    except('.example2', 'HTML must contain .activator');
    except('.example3', 'HTML container for tree data must have an unique id');
    except('.example4', 'HTML must contain input.ajax_url');
    except('.doesNotExist', 'Trying to set up slc.treecategories, but no real content to hook into given');
});

test('controller registration', function () {
    expect(4);
    var controller1 = ctrlMaker('var3');
    controller1.addTreeObjects($('.example5'));
    var trees = SLC_TREECATEGORIES.getTrees($('.example5'), 'var3');
    equals(true, trees !== undefined, 'We must be able to get a tree, now that we registered it');
    var i;
    for(i=0;i < trees.length;i+=1){
        equals(true, trees[i] !== undefined);
    }
    var single_tree  = trees[0];
    equals(true, single_tree !== undefined, 'We must be able to get a tree, now that we registered it');
});

test('dynatree config', function () {
    expect(6);
    var controller1 = ctrlMaker('var4', 'json_example', '', 'treewait', 'treeerror');
    controller1.addTreeObjects($('.example5'));
    var trees = SLC_TREECATEGORIES.getTrees($('.example5'), 'var4');
    var dynatree_options = trees[0].getDynatreeOptions();
    equals(dynatree_options.persistent, false);
    equals(dynatree_options.checkbox, true);
    equals(dynatree_options.strings.loading, 'treewait');
    equals(dynatree_options.strings.loadError, 'treeerror');
    equals(typeof dynatree_options.onSelect, "function");
    equals(dynatree_options.idPrefix, 'ex5');
});

test('tree switch on and off', function () {
    expect(3);
    var controller = ctrlMaker('var');
    controller.addTreeObjects($('.example9'));
    var tree = SLC_TREECATEGORIES.getTrees($('.example9'), 'var')[0];
    var before_after = function (mthd, key){
        var before = $('.items').filter(function () {
            return this.id === tree.idBuilder(key);
        });
        mthd(key);
        var after = $('.items').filter(function () {
            return this.id === tree.idBuilder(key);
        });
        return after.length - before.length;
    };
    equals(before_after(function(the_key){
        tree.toggleActive(true, {data: {key: the_key}});
    }, 'new_cat'), 1);
    equals(before_after(function(the_key){
        tree.toggleActive(true, {data: {key: the_key}});
    }, 'new_cat2'), 1);
    equals(before_after(function(the_key){
        tree.toggleActive(false, {data: {key: the_key}});
    }, 'new_cat'), -1);
});

test('delete button', function () {
    expect(5);
    var controller = ctrlMaker('var');
    controller.addTreeObjects($('.example5'));
    var tree = SLC_TREECATEGORIES.getTrees($('.example5'), 'var')[0];
    equals($('.example5 img.remove').length, 2);
    tree.toggleActive(true, {data: {key: '123'}});
    equals($('.example5 img.remove').length, 3);
    tree.toggleActive(false, {data: {key: '123'}});
    equals($('.example5 img.remove').length, 2);
    tree.toggleActive(true, {data: {key: '123'}});
    equals($('.example5 img.remove').length, 3);
    tree.toggleActive(false, {data: {key: '123'}});
    equals($('.example5 img.remove').length, 2);
});

test('lazy loading', function () {
    expect(5);
    var dynatree = $($('.example6 .tree')[0]);
    var controller = ctrlMaker('var');
    controller.addTreeObjects($('.example6'));
    equals($('.example6 .ui-dynatree-container').length, 0, 'No tree exists yet');
    ok(dynatree.dynatree('getTree') === undefined);
    $('.example6 .activator').click();
    ok(dynatree.dynatree('getTree') !== undefined);
    equals($('.example6 .ui-dynatree-container').length, 1, 'Tree exists');
    $('.example6 .activator').click();
    equals($('.example6 .ui-dynatree-container').length, 1, 'Tree still exists, we do not delete it');
});

test('multiselect', function () {
    expect(9);
    var controller = ctrlMaker('var');
    controller.addTreeObjects($('.example7'));
    var tree1 = SLC_TREECATEGORIES.getTrees($('.example7')[0], 'var')[0];
    var tree2 = SLC_TREECATEGORIES.getTrees($('.example7')[1], 'var')[0];
    var tree3 = SLC_TREECATEGORIES.getTrees($('.example7')[2], 'var')[0];
    controller.addActive(tree1);
    controller.addActive(tree3);
    tree1.toggleActive(true, {data: {key: 't1'}});
    tree2.toggleActive(true, {data: {key: 't2'}});
    controller.resetActive();
    tree3.toggleActive(true, {data: {key: 't3'}});
    ok(tree1.isActive('t1'));
    ok(!tree1.isActive('t2'));
    ok(!tree1.isActive('t3'));
    ok(!tree2.isActive('t1'));
    ok(tree2.isActive('t2'));
    ok(!tree2.isActive('t3'));
    ok(tree3.isActive('t1'));
    ok(!tree3.isActive('t2'));
    ok(tree3.isActive('t3'));
});
