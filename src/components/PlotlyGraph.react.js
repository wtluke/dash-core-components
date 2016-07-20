import React, {Component, PropTypes} from 'react';
import Plotly from 'plotly.js';

const VALID_EVENT_KEYS = ['x', 'y', 'z', 'labels', 'values', 'pointNumber',
                          'curveNumber'];

const filterEventData = (eventData) => {
    // Create a new object
    return {
        // `Array.prototype.map` creates a new array of points.
        points: eventData.points.map((pointData) =>
            // "Backwards filtering" of keys via `reduce` to create new object.
            // http://stackoverflow.com/a/32184094
            VALID_EVENT_KEYS.reduce((result, currentKey) => {
                const currentVal = pointData[currentKey];
                return Object.assign(result, {[currentKey]: currentVal});
            }, {})
        )
    };
};

export default class PlotlyGraph extends Component {
    plot(props) {
        const {id, data, layout} = props;
        Plotly.newPlot(id, data, layout);
    }

    bindEvents() {
        const {bindClick, bindHover, id, valueChanged} = this.props;

        // Get DOM node to call jQuery-provided `on` event binder.
        const plotlyNode = document.getElementById(id);

        if (bindClick) {
            this.clickEmitter = plotlyNode.on('plotly_click', (eventData) => {
                const clickData = filterEventData(eventData);
                valueChanged({clickData});
            });
        }

        if (bindHover) {
            this.hoverEmitter = plotlyNode.on('plotly_hover', (eventData) => {
                const hoverData = filterEventData(eventData);
                valueChanged({hoverData});
            });
        }
    }

    // "Invoked once, only on the client (not on the server),
    // immediately after the initial rendering occurs."
    componentDidMount() {
        this.plot(this.props);
        this.bindEvents();
    }

    componentWillUnmount() {
        const {clickEmitter, hoverEmitter} = this;

        if (clickEmitter) {
            clickEmitter.removeAllListeners();
        }

        if (hoverEmitter) {
            hoverEmitter.removeAllListeners();
        }
    }

    shouldComponentUpdate() {
        // Never re-render after initialization.
        // Let Plotly.js own the DOM node.
        return false;
    }

    componentWillReceiveProps(nextProps) {
        // TODO optimize this check
        const dataChanged = JSON.stringify(this.props.data) !== JSON.stringify(nextProps.data)
        if (dataChanged) return this.plot(nextProps);

        const layoutChanged = JSON.stringify(this.props.layout) !== JSON.stringify(nextProps.layout);
        if (layoutChanged) return this.plot(nextProps);
    }

    render(){
        const {width, height, id} = this.props
        const style = {width, height};

        return (
            <div
                id={id}
                ref={(node) => this._plotlyNode = node}
                style={style}
            />
        );
    }
}

PlotlyGraph.propTypes = {
    /**
     * Set to `true` if this graph should emit click events
     */
    bindClick: PropTypes.bool,

    /**
     * Data from latest click event
     */
    clickData: PropTypes.object,

    /**
     * Set to `true` if this graph should emit hover events
     */
    bindHover: PropTypes.bool,

    /**
     * Data from latest click event
     */
    hoverData: PropTypes.object,

    /**
     * Plotly `figure.data` array. See schema:
     * https://api.plot.ly/v2/plot-schema?sha1=
     */
    data: PropTypes.array,

    /**
     * Plotly `figure.layout` object. See schema:
     * https://api.plot.ly/v2/plot-schema?sha1=
     */
    layout: PropTypes.object,

    /**
     * Height of graph, e.g. 600, '600px' or '100%'
     */
    height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),

    /**
     * Width of graph, e.g. 600, '600px' or '100%'
     */
    width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),

    /**
     * Function that updates the state tree.
     */
    valueChanged: PropTypes.func.isRequired
}

PlotlyGraph.defaultProps = {
    clickData: null,
    data: [],
    layout: {},
    height: '600px',
    width: '100%'
};
