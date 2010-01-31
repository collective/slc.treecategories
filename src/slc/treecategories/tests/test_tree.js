/*global module, test, expect, equals, SLC_TREECATEGORIES, same, ok $ */
module('tree', {
      setup: function () {}
    , teardown: function () {
        SLC_TREECATEGORIES.reset();
    }
});

var ctrlMaker = function (var_, url, treewait, treeerror){
    return SLC_TREECATEGORIES.getController({variable : var_,
                                             vocabulary_url: url,
                                             tree_wait: treewait,
                                             tree_error: treeerror});};
test('controller failureInit', function() {
    expect(6);
    function except(varname, url, msg){
        var excepted;
        try{
            SLC_TREECATEGORIES.getController({
                variable: varname, 
                vocabulary_url: url});
        } catch (e) {
            equals(e.name, 'SETUP');
            equals(e.message, msg);
            excepted = true;
        }
        equals(excepted, true);
    }
    except(undefined, 'ignore', 'treecategories set up without variable');
    except('ignore', undefined, 'treecategories set up without vocabulary url');
});

test('controller init', function() {
    expect(2);
    var controller1 = ctrlMaker('var1', 'http://127.0.0.1');
    var controller2 = ctrlMaker('var1', 'http://127.0.0.1');
    var controller3 = ctrlMaker('var2', 'http://127.0.0.1');
    same(controller1, controller2, "We must get the same instance");
    equals(false, controller2 === controller3, "Different variable, must result in different controller");
});

test('controller failedRegistrations', function () {
    expect(12);
    var controller = ctrlMaker('var1', 'ignore');
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
    except('.exampleFail1', 'HTML must contain .tree');
    except('.exampleFail2', 'HTML must contain .activator');
    except('.exampleFail3', 'HTML container for tree data must have an unique id');
    except('.doesNotExist', 'Trying to set up slc.treecategories, but no real content to hook into given');
});

test('controller registration', function () {
    expect(3);
    var controller1 = ctrlMaker('var3', 'json_example');
    controller1.addTreeObjects($('.example1'));
    var trees = SLC_TREECATEGORIES.getTree($('.example1'), 'var3');
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
    var controller1 = ctrlMaker('var4', 'json_example', 'treewait', 'treeerror');
    controller1.addTreeObjects($('.example1'));
    var trees = SLC_TREECATEGORIES.getTree($('.example1'), 'var4');
    var dynatree_options = trees[0].getDynatreeOptions();
    equals(dynatree_options.persistent, false);
    equals(dynatree_options.checkbox, true);
    equals(dynatree_options.strings.loading, 'treewait');
    equals(dynatree_options.strings.loadError, 'treeerror');
    equals(typeof dynatree_options.onSelect, "function");
    equals(dynatree_options.idPrefix, 'ex1');
});

test('tree switch on and off', function () {
    expect(3);
    var controller = ctrlMaker('var', 'json_example');
    controller.addTreeObjects($('.example1'));
    var tree = SLC_TREECATEGORIES.getTree($('.example1'), 'var')[0];
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
    var controller = ctrlMaker('var', 'json_example');
    controller.addTreeObjects($('.example2'));
    var tree = SLC_TREECATEGORIES.getTree($('.example2'), 'var')[0];
    equals($('.example2 img.remove').length, 2);
    tree.toggleActive(true, {data: {key: '123'}});
    equals($('.example2 img.remove').length, 3);
    tree.toggleActive(false, {data: {key: '123'}});
    equals($('.example2 img.remove').length, 2);
    tree.toggleActive(true, {data: {key: '123'}});
    equals($('.example2 img.remove').length, 3);
    $('#' + tree.idBuilder('123') + ' img').click();
    equals($('.example2 img.remove').length, 2);
});

test('lazy loading', function () {
    expect(3);
    var controller = ctrlMaker('var', 'json_example');
    controller.addTreeObjects($('.example3'));
    equals($('.example3 .ui-dynatree-container').length, 0);
    $('.example3 .activator').click();
    equals($('.example3 .ui-dynatree-container').length, 1);
    $('.example3 .activator').click();
    equals($('.example3 .ui-dynatree-container').length, 1);
});

test('multiselect', function () {
    expect(9);
    var controller = ctrlMaker('var', 'json_example');
    controller.addTreeObjects($('.example4'));
    var tree1 = SLC_TREECATEGORIES.getTree($('.example4')[0], 'var')[0];
    var tree2 = SLC_TREECATEGORIES.getTree($('.example4')[1], 'var')[0];
    var tree3 = SLC_TREECATEGORIES.getTree($('.example4')[2], 'var')[0];
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

