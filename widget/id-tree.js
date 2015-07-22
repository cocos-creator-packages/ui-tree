EditorUI.idtree = (function () {
    function _getLastChildRecursively ( itemEL ) {
        if ( itemEL.foldable && !itemEL.folded ) {
            return _getLastChildRecursively ( Polymer.dom(itemEL).lastElementChild );
        }
        return itemEL;
    }

    function _checkFoldable ( el ) {
        return Polymer.dom(el).childNodes.length > 0;
    }

    var idtree = {
        'ui-idtree': true,

        created: function () {
            this._id2el = {};
            this._activeElement = null;
        },

        addItem: function ( parentEL, itemEL, options ) {
            options = options || {};
            for ( var p in options ) {
                itemEL[p] = options[p];
            }

            var id = options.id;
            if ( id === null || id === undefined ) {
                throw new Error( 'The id you provide is invalid: ' + id );
            }

            //
            if ( this._id2el[id] ) {
                throw new Error( 'The id already added in the tree: ' + id );
            }

            //
            var name = options.name || '';
            var folded = options.folded;
            if ( folded === null || folded === undefined )
                folded = true;

            // init item element
            itemEL._userId = id;
            itemEL.name = name;
            itemEL.folded = folded;
            if ( itemEL.foldable === undefined ) {
                itemEL.foldable = false;
            }

            // append to parent
            if ( parentEL.insertItem ) {
                parentEL.insertItem(itemEL);
            } else {
                Polymer.dom(parentEL).appendChild(itemEL);
            }

            if ( parentEL !== this ) {
                parentEL.foldable = true;
            }

            // add to id table
            this._id2el[id] = itemEL;
        },

        removeItem: function ( itemEL ) {
            var parentEL = Polymer.dom(itemEL).parentNode;
            Polymer.dom(parentEL).removeChild(itemEL);

            if ( parentEL !== this ) {
                parentEL.foldable = _checkFoldable(parentEL);
            }

            var self = this;
            function deleteRecursively (itemEL) {
                delete self._id2el[itemEL._userId];

                // children
                var children = Polymer.dom(itemEL).children;
                for ( var i = 0; i < children.length; ++i ) {
                    deleteRecursively(children[i]);
                }
            }
            deleteRecursively(itemEL);
        },

        removeItemById: function (id) {
            var el = this._id2el[id];
            if ( el ) {
                this.removeItem(el);
            }
        },

        setItemParent: function ( itemEL, parentEL ) {
            if ( EditorUI.isSelfOrAncient( parentEL, itemEL ) ) {
                throw new Error('Failed to set item parent to its child');
            }

            var oldParentEL = Polymer.dom(itemEL).parentNode;

            //
            if ( parentEL.insertItem ) {
                parentEL.insertItem(itemEL);
            } else {
                Polymer.dom(parentEL).appendChild(itemEL);
            }
            parentEL.foldable = _checkFoldable(parentEL);

            //
            if ( oldParentEL !== this ) {
                oldParentEL.foldable = _checkFoldable(oldParentEL);
            }
        },

        setItemParentById: function (id, parentId) {
            var itemEL = this._id2el[id];
            if ( !itemEL ) {
                return;
            }
            var parentEL = parentId ? this._id2el[parentId] : this;
            if ( !parentEL ) {
                return;
            }
            this.setItemParent(itemEL, parentEL);
        },

        renameItemById: function (id, newName) {
            var itemEL = this._id2el[id];
            if ( !itemEL ) {
                return;
            }
            itemEL.name = newName;
        },

        nextItem: function ( curItem, skipChildren ) {
            var curItemDOM = Polymer.dom(curItem);
            if ( !skipChildren && curItem.foldable && !curItem.folded ) {
                return curItemDOM.firstElementChild;
            }

            if ( curItemDOM.nextElementSibling )
                return curItemDOM.nextElementSibling;

            var parentEL = curItemDOM.parentNode;
            if ( parentEL === this ) {
                return null;
            }

            return this.nextItem(parentEL, true);
        },

        prevItem: function ( curItem ) {
            var curItemDOM = Polymer.dom(curItem);

            var prevSiblingEL = curItemDOM.previousSibling;
            if ( prevSiblingEL ) {
                if ( prevSiblingEL.foldable && !prevSiblingEL.folded ) {
                    return _getLastChildRecursively (prevSiblingEL);
                }
                else {
                    return prevSiblingEL;
                }
            }

            var parentEL = curItemDOM.parentNode;
            if ( parentEL === this ) {
                return null;
            }

            return parentEL;
        },

        lastItem: function () {
            var lastChildEL = Polymer.dom(this).lastElementChild;
            if ( lastChildEL && lastChildEL.foldable && !lastChildEL.folded ) {
                return _getLastChildRecursively (lastChildEL);
            }
            return lastChildEL;
        },

        clear: function () {
            var thisDOM = Polymer.dom(this);
            while (thisDOM.firstChild) {
                thisDOM.removeChild(thisDOM.firstChild);
            }
            this._id2el = {};
        },

        expand: function ( id, expand ) {
            var itemEL = this._id2el[id];
            var parentEL = Polymer.dom(itemEL).parentNode;
            while ( parentEL ) {
                if ( parentEL === this )
                    break;

                parentEL.folded = !expand;
                parentEL = Polymer.dom(parentEL).parentNode;
            }
        },

        scrollToItem: function ( el ) {
            window.requestAnimationFrame( function () {
                this.$.content.scrollTop = el.offsetTop + 16 - this.offsetHeight/2;
            }.bind(this));
        },

        selectItemById: function ( id ) {
            var itemEL = this._id2el[id];
            if ( itemEL ) {
                itemEL.selected = true;
            }
        },

        unselectItemById: function ( id ) {
            var itemEL = this._id2el[id];
            if ( itemEL ) {
                itemEL.selected = false;
            }
        },

        activeItemById: function ( id ) {
            var itemEL = this._id2el[id];
            if ( itemEL ) {
                this._activeElement = itemEL;
            }
        },

        deactiveItemById: function ( id ) {
            var itemEL = this._id2el[id];
            if ( itemEL && this._activeElement === itemEL ) {
                this._activeElement = null;
            }
        },

        activeItem: function ( itemEL ) {
            this._activeElement = itemEL;
        },

        deactiveItem: function ( itemEL ) {
            if ( itemEL && this._activeElement === itemEL ) {
                this._activeElement = null;
            }
        },

        dumpItemStates: function () {
            var states = [];

            for ( var id in this._id2el ) {
                if ( this._id2el[id].foldable ) {
                    states.push({
                        id: this._id2el[id]._userId,
                        folded: this._id2el[id].folded
                    });
                }
            }

            return states;
        },

        restoreItemStates: function (states) {
            if ( !states )
                return;

            states.forEach( function ( state ) {
                var itemEL = this._id2el[state.id];
                if ( itemEL ) {
                    itemEL.folded = state.folded;
                }
            }.bind(this));
        },

        getToplevelElements: function ( ids ) {
            var elements = new Array(ids.length);
            for ( var i = 0; i < ids.length; ++i ) {
                elements[i] = this._id2el[ids[i]];
            }
            var resultELs = Editor.Utils.arrayCmpFilter ( elements, function ( elA, elB ) {
                if ( elA.contains(elB) ) {
                    return 1;
                }
                if ( elB.contains(elA) ) {
                    return -1;
                }
                return 0;
            } );
            return resultELs;
        },
    };

    return idtree;
})();
