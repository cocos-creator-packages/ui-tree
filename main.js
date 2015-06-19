module.exports = {
    load: function () {
    },

    unload: function () {
    },

    'ui-tree:open': function () {
        Editor.Panel.open('ui-tree.preview');
    },
};
