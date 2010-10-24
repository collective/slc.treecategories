jq(document).ready(function(){
    jq('.inline_tree_widget').each(function () {
        if(SLC_TREECATEGORIES.initialized[this.id] !== undefined){
            return;
        }
        SLC_TREECATEGORIES.initialized[this.id] = true;
        var ctrl_args = {
	        'html_input_id': this.id,
	        'fieldName': jq(this).find(".fieldName")[0].id,
	        'vocabulary_url':jq(this).find('input.vocabulary_url').val(),
		};
        var ctrl = SLC_TREECATEGORIES.getController(ctrl_args);
        ctrl.addTreeObjects(this);
    });
});
