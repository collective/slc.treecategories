TestCase('TreeTestCase', {
	test_initialisation : function() {
		assertFalse(self.tree_portlet_initialised == true);
		portlet_tree_init()
	}
})