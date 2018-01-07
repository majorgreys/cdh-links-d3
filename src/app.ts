import { forceSimulation, forceLink, forceManyBody, forceCenter, Simulation, SimulationNodeDatum, SimulationLinkDatum } from 'd3-force';
import { scaleOrdinal, schemeCategory20 } from 'd3-scale';
import { select } from 'd3-selection';
import { csv, event, drag } from 'd3';
import { map, union, findIndex, find } from 'lodash';

const width = 960;
const height = 480;

interface Node extends SimulationNodeDatum {
    id: string;
    group: string;
}

interface Link extends SimulationLinkDatum<Node> {
    source: Node;
    target: Node;
    value: number;
}

const simulation = forceSimulation()
    .force("link", forceLink().id((d:Node) => {return d.id;}))
    .force("charge", forceManyBody().strength(-120))
    .force("center", forceCenter(width / 2, height / 2));

csv('data/booktags.csv', (e, d) => {

    // Build list of nodes with `book_title` and `subject` columns
    const nodes: Node[] = union(
        map(d, r => { return { id: r.book_title, group: "Book" }}),
        map(d, r => { return { id: r.subject, group: "Subject" }})
    );
    
    // Build list links by replacing subject and book by their index number
    const links: Link[] = map(d, r => {
        return {
            source: find(nodes, n => n.id == r.book_title),
            target: find(nodes, n => n.id == r.subject),
            value: Number(r.n)
        }
    });

    const svg = select('#root')
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    const color = scaleOrdinal(schemeCategory20);

    var link = svg.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(links)
        .enter().append("line")
        .attr("stroke-width", function (d) { return Math.sqrt(d.value); });

    var node = svg.selectAll("circle").data(nodes)
        .enter().append("circle")
        .attr("r", 5)
        .attr("fill", function(d) { return color(d.group); })
        .call(drag<SVGCircleElement, Node>()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    function dragstarted(this: SVGCircleElement, d: Node) {
        simulation.restart();
        simulation.alpha(1.0);
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(this: SVGCircleElement, d: Node) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragended(this: SVGCircleElement, d: Node) {
        d.fx = null;
        d.fy = null;
        simulation.alphaTarget(0.1);
    }

    simulation.force("links", forceLink(links));

    function ticked() {
        const that: Simulation<Node, Link> = this;
        link
            .attr("x1", function (d:Link) { return d.source.x; })
            .attr("y1", function (d:Link) { return d.source.y; })
            .attr("x2", function (d:Link) { return d.target.x; })
            .attr("y2", function (d:Link) { return d.target.y; });

        node
            .attr("cx", function (d:Node) { return d.x; })
            .attr("cy", function (d:Node) { return d.y; });
    }

    simulation.nodes(nodes).on("tick", ticked);
});
