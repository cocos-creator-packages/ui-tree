EditorUI.idtree = (function () {
    function _checkFoldable ( el ) {
        return Polymer.dom(el).childNodes.length > 0;
    }

    var idtree = {
        'ui-idtree': true,

        created: function () {
            this.id2el = {};
        },

        addItem: function ( parentEL, itemEL, name, id ) {
            if ( !id ) {
                throw new Error( 'The id you provide is invalid: ' + id );
            }

            if ( this.id2el[id] ) {
                throw new Error( 'The id already added in the tree: ' + id );
            }

            // init item element
            itemEL.userId = id;
            itemEL.name = name;
            itemEL.folded = true;
            if ( itemEL.foldable === undefined ) {
                itemEL.foldable = false;
            }

            // append to parent
            Polymer.dom(parentEL).appendChild(itemEL);
            if ( parentEL !== this ) {
                parentEL.foldable = true;
            }

            // add to id table
            this.id2el[id] = itemEL;
        },

        removeItem: function ( itemEL ) {
            var parentEL = Polymer.dom(itemEL).parentNode;
            Polymer.dom(parentEL).removeChild(itemEL);

            if ( parentEL !== this ) {
                parentEL.foldable = _checkFoldable(parentEL);
            }

            var self = this;
            function deleteRecursively (itemEL) {
                delete self.id2el[itemEL.userId];

                // children
                var children = Polymer.dom(itemEL).children;
                for ( var i = 0; i < children.length; ++i ) {
                    deleteRecursively(children[i]);
                }
            }
            deleteRecursively(itemEL);
        },

        removeItemById: function (id) {
            var el = this.id2el[id];
            if ( el ) {
                this.removeItem(el);
            }
        },

        setItemParent: function ( itemEL, parentEL ) {
            if ( EditorUI.isSelfOrAncient( parentEL, itemEL ) ) {
                throw new Error('Failed to set item parent to its child');
            }

            var oldParentEL = Polymer.dom(itemEL).parentNode;
            Polymer.dom(parentEL).appendChild(itemEL);

            if ( oldParentEL !== this ) {
                oldParentEL.foldable = _checkFoldable(oldParentEL);
            }
        },

        setItemParentById: function (id, parentId) {
            var itemEL = this.id2el[id];
            if ( !itemEL ) {
                return;
            }
            var parentEL = parentId ? this.id2el[parentId] : this;
            if ( !parentEL ) {
                return;
            }
            this.setItemParent(itemEL, parentEL);
        },

        renameItemById: function (id, newName) {
            var itemEL = this.id2el[id];
            if ( !itemEL ) {
                return;
            }
            itemEL.name = newName;
        },

        clear: function () {
            var thisDOM = Polymer.dom(this);
            while (thisDOM.firstChild) {
                thisDOM.removeChild(thisDOM.firstChild);
            }
            this.id2el = {};
        },

        expand: function ( id, expand ) {
            var itemEL = this.idToItem[id];
            var parentEL = Polymer.dom(itemEL).parentNode;
            while ( parentEL ) {
                if ( parentEL === this )
                    break;

                parentEL.folded = !expand;
                parentEL = Polymer.dom(parentEL).parentNode;
            }
        },
    };

    return idtree;
})();
