import React, {Component} from 'react';
import classNames from 'classnames';
import * as actions from '../../actions';
import {connect} from 'react-redux';
import {TableCell} from '.';
import {LinkDecorator} from '../links/LinkDecorator';
import {ContentState, EditorState, CompositeDecorator, convertToRaw, convertFromRaw} from 'draft-js';

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name TableBlockComponent
 * @param block {Object} Information about this atomic block.
 * @param contentState {Object} The content state containing this atomic block.
 * @param setActiveCell {Function} When called, sets the parent (main) editor to read only.
 * @description Handles a cell in the table, as well as the containing editor.
 */
export class TableBlockComponent extends Component {
    constructor(props) {
        super(props);

        this.setCell = this.setCell.bind(this);
        this.getCell = this.getCell.bind(this);
        this.data = this.data.bind(this);
        this.onFocus = this.onFocus.bind(this);
    }

    /**
     * @ngdoc method
     * @name TableBlockComponent#setCell
     * @param {Number} row The row of the cell in the table
     * @param {Number} col The column of the cell in the table
     * @param {Object} cellState The state of the editor within the cell
     * @description Updates data about this cell inside the entity for this atomic
     * block.
     */
    setCell(row, col, cellState) {
        const cellContentState = cellState.getCurrentContent();
        const data = this.data();
        const {block, contentState, editorState, parentOnChange} = this.props;
        const entityKey = block.getEntityAt(0);

        if (!data.cells[row]) {
            data.cells[row] = [];
        }

        data.cells[row][col] = convertToRaw(cellContentState);

        contentState.replaceEntityData(entityKey, {data});
        parentOnChange(editorState);
    }

    /**
     * @ngdoc method
     * @name TableBlockComponent#getCell
     * @param {Number} row The row of the cell in the table
     * @param {Number} col The column of the cell in the table
     * @description Retrieves the content state of the cell at row/col.
     */
    getCell(row, col) {
        const {cells} = this.data();
        const decorator = new CompositeDecorator([LinkDecorator]);

        let editorState;

        if (!cells[row] || !cells[row][col]) {
            editorState = EditorState.createWithContent(ContentState.createFromText(''), decorator);
        } else {
            editorState = EditorState.createWithContent(convertFromRaw(cells[row][col]), decorator);
        }

        return editorState;
    }

    /**
     * @ngdoc method
     * @name TableBlockComponent#data
     * @description Returns the data contained in the entity of this atomic block.
     * @return {Object}
     */
    data() {
        const {block, contentState} = this.props;
        const entityKey = block.getEntityAt(0);
        const entity = contentState.getEntity(entityKey);
        const {data} = entity.getData();

        return data;
    }

    onFocus(i, j) {
        const {setActiveCell, block} = this.props;

        setActiveCell(i, j, block.key);
    }

    render() {
        const {numRows, numCols, withHeader} = this.data();

        let cx = classNames({
            'table-block': true,
            'table-header': withHeader
        });

        return (
            <div className={cx}>
                <table>
                    <tbody>
                        {Array.from(new Array(numRows)).map((v, i) =>
                            <tr key={`col-${i}-${numRows}-${numCols}`}>
                                {Array.from(new Array(numCols)).map((v, j) =>
                                    <TableCell
                                        key={`cell-${i}-${j}-${numRows}-${numCols}`}
                                        editorState={this.getCell(i, j)}
                                        onChange={this.setCell.bind(this, i, j)}
                                        onFocus={this.onFocus.bind(this, i, j)} />
                                )}
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        );
    }
}

TableBlockComponent.propTypes = {
    block: React.PropTypes.object.isRequired,
    contentState: React.PropTypes.object.isRequired,
    editorState: React.PropTypes.object.isRequired,
    setActiveCell: React.PropTypes.func.isRequired,
    parentOnChange: React.PropTypes.func.isRequired
};

const mapDispatchToProps = (dispatch) => ({
    parentOnChange: (editorState) => dispatch(actions.changeEditorState(editorState)),
    setActiveCell: (i, j, key) => dispatch(actions.setActiveCell(i, j, key))
});

const mapStateToProps = (state) => ({
    editorState: state.editorState
});

export const TableBlock = connect(mapStateToProps, mapDispatchToProps)(TableBlockComponent);
