module COLLADA.Loader {

    export class Utils {

        static forEachChild(node: Node, fn: (child: Node) => void) {

            var childNodes: NodeList = node.childNodes;
            var childNodesLength: number = childNodes.length;

            // Iterate over all children (can be nodes or text content)
            for (var i: number = 0; i < childNodesLength; i++) {
                var child: Node = childNodes[i];

                // Skip text content
                if (child.nodeType !== 1) continue;

                // Callback for child node
                fn(child);
            }
        }
    };
}