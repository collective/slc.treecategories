function tree_init(){
    // each select input item that belongs to this widget contains the 
	// state of the widget. We look for that input item to get the state, and
    // all configuration for the dynamic elements. the base id for each 
	// element, for example. Interaction with plone is done via the select box
    // only!
	if(self.tree_initialised == true) {
		return
	}
	self.tree_initialised = true;
    jq('.tree_values').each(function(item){
        base_id = this.id
        fx = this.fx
        if (!fx) {
            fx = {
                height: "toggle",
                duration: 200
            }
        };
        // for some reason the select element is not
        // wrapped by jquery, we dot it here
        data_field = jq(this)
        function jq_(suffix){
            // find an object with the current base id and the specified suffix.
            return jq("#" + base_id + '_' + suffix)
        }
        function initTree(event){
            // update the trees. This method is the preferred way to update the tree contents
            
            // One tree shall only show the unselected
            // methods, the other only the selected
            // We build one filter here, that can be
            // used for both xmlhttprequests
            var filters = ""
            data_field.children().each(function(i){
                filters += '&key_limiter:list=' + this.value;
            });
            filters += '&full_text_filter=' + jq_('filter').val()
            
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
                jq_('can_have').dynatree('getRoot').removeChildren()
                jq_('has').dynatree('getRoot').removeChildren()
            }
            jq_("can_have").dynatree({
                onActivate: function(dtnode){
                    data_field.append(new Option(dtnode.data.title, dtnode.data.key, true))
                    dtnode.visit(function(node, data){
                        jq('#' + base_id + ' option[value=' + node.data.key + ']').remove();
                    }, false)
                    data_field.change()
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
                },
            });
            jq_("has").dynatree({
                onActivate: function(dtnode){
                    dtnode.toDict(true, function(dict){
                        jq('#' + base_id + ' option[value=' + dict.key + ']').remove();
                    })
                    data_field.change()
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
                },
            });
        }
        function updateTree(event){
            var filters = ""
            data_field.children().each(function(i){
                filters += '&key_limiter:list=' + this.value;
            });
            filters += '&full_text_filter=' + jq_('filter').val()
            
            function _updateTree(item, url){
                jQuery.getJSON(url, function(data){
                    item.dynatree('getRoot').removeChildren();
                    item.dynatree('getRoot').append(data);
                })
            }
            
            _updateTree(jq_("has"), jq_('vocabulary_url').val() + '/json?1=1' + filters)
            _updateTree(jq_("can_have"), jq_('vocabulary_url').val() + '/json?1=1' + filters + '&invert_key_limiter=True')
            
            
        }
        data_field.change(updateTree);
        initTree();
        
        // Each tree item has a filter that acts without
        // submit button. It waits 500ms before doing
        // the actual filtering
        treesearch_timerid = 'None'
        jq_('filter').bind('keypress', function(e){
            if (treesearch_timerid != 'None') {
                clearTimeout(treesearch_timerid);
            }
            treesearch_timerid = setTimeout(updateTree, 500);
        })
    });
    
};
