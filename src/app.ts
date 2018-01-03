import { forceSimulation, forceLink, forceManyBody, forceCenter } from 'd3-force';
import { scaleOrdinal, schemeCategory20 } from 'd3-scale';
import { select } from 'd3-selection';
import { csv, event, drag } from 'd3';
import { map, union, findIndex } from 'lodash';

const width = 960;
const height = 480;

interface Link {
    source: number;
    target: number;
    value: number;
}

interface Node {
    id: string;
    group: string;
}

csv('/data/booktags.csv', (e, d) => {

    console.log
    
    const nodes: Node[] = union(
        map(d, r => {
            return {
                id: r.book_title,
                group: "Book"
            }}),
        map(d, r => {
            return {
                id: r.subject,
                group: "Subject"
            }})
    );
    
    const links: Link[] = map(d, r => {
        return {
            source: findIndex(nodes, n => n.id == r.book_title),
            target: findIndex(nodes, n => n.id == r.subject),
            value: Number(r.n)
        }
    });

    console.log(links);
    console.log(nodes);

    const force = forceSimulation()
        .nodes(nodes)
        .force("link", forceLink(links).distance(50))
        .force("charge", forceManyBody().strength(-120))
        .force("center", forceCenter(width / 2, height / 2));

    const svg = select('#root')
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    const color = scaleOrdinal(schemeCategory20);

    const node = svg
        .selectAll('circle')
        .data(nodes)
        .enter()
        .append<SVGCircleElement>('circle')
        .attr('r', 5)
        .style('stroke', '#FFFFFF')
        .style('stroke-width', 1.5)
        .style('fill', (d: any) => color(d.group));

    force.on("tick", ()=>{return this.ticked()});

    node.attr('cx', (d: any) => d.x).attr('cy', (d: any) => d.y);
});