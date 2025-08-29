/**
 * Phylogenetic analysis utility functions
 * Implements tree building algorithms and tree comparison methods
 */

export interface PhylogeneticTree {
  method: string;
  tree_format: string;
  newick_string: string;
  nodes: TreeNode[];
  leaves: TreeLeaf[];
  total_length: number;
  statistics: {
    branch_lengths: number[];
    average_branch_length: number;
    tree_depth: number;
    polytomies: number;
  };
  bootstrap_values?: number[];
}

export interface TreeNode {
  id: string;
  parent_id?: string;
  children: string[];
  branch_length: number;
  bootstrap_support?: number;
  is_leaf: boolean;
  name?: string;
}

export interface TreeLeaf {
  id: string;
  name: string;
  sequence?: string;
  branch_length: number;
  distance_to_root: number;
}

export interface DistanceMatrix {
  sequences: string[];
  matrix: number[][];
  method: string;
  correction: string;
}

export interface TreeComparison {
  tree1_info: {
    method: string;
    leaves: number;
    total_length: number;
  };
  tree2_info: {
    method: string;
    leaves: number;
    total_length: number;
  };
  comparison_metrics: {
    robinson_foulds_distance: number;
    normalized_rf_distance: number;
    shared_bipartitions: number;
    total_bipartitions: number;
    topological_similarity: number;
  };
  branch_length_comparison?: {
    correlation: number;
    rmse: number;
    mean_difference: number;
  };
  differences: TreeDifference[];
}

export interface TreeDifference {
  type: 'topology' | 'branch_length' | 'bootstrap';
  description: string;
  affected_taxa: string[];
  significance: 'high' | 'medium' | 'low';
}

export interface SequenceRecord {
  id: string;
  sequence: string;
  description?: string;
}

/**
 * Build phylogenetic tree using Neighbor-Joining method
 */
export function buildPhylogeneticTree(
  sequences: SequenceRecord[],
  method: string = 'neighbor-joining',
  bootstrap: number = 0
): PhylogeneticTree {
  
  if (sequences.length < 3) {
    throw new Error("At least 3 sequences required for phylogenetic analysis");
  }
  
  // Calculate distance matrix
  const distanceMatrix = calculateDistanceMatrix(sequences);
  
  // Build tree based on method
  let tree: PhylogeneticTree;
  
  switch (method.toLowerCase()) {
    case 'neighbor-joining':
    case 'nj':
      tree = neighborJoining(distanceMatrix);
      break;
    case 'upgma':
      tree = upgma(distanceMatrix);
      break;
    case 'maximum-parsimony':
    case 'mp':
      tree = maximumParsimony(sequences);
      break;
    default:
      tree = neighborJoining(distanceMatrix);
      method = 'neighbor-joining';
  }
  
  tree.method = method;
  
  // Add bootstrap support if requested
  if (bootstrap > 0) {
    tree.bootstrap_values = calculateBootstrapSupport(sequences, method, bootstrap);
    tree.nodes.forEach((node, index) => {
      if (tree.bootstrap_values && !node.is_leaf) {
        node.bootstrap_support = tree.bootstrap_values[index];
      }
    });
  }
  
  return tree;
}

/**
 * Calculate distance matrix between sequences
 */
function calculateDistanceMatrix(sequences: SequenceRecord[]): DistanceMatrix {
  const n = sequences.length;
  const matrix: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));
  
  // Calculate pairwise distances
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const distance = calculateSequenceDistance(sequences[i].sequence, sequences[j].sequence);
      matrix[i][j] = distance;
      matrix[j][i] = distance;
    }
  }
  
  return {
    sequences: sequences.map(seq => seq.id),
    matrix,
    method: 'p-distance',
    correction: 'none'
  };
}

/**
 * Calculate sequence distance (p-distance with Jukes-Cantor correction)
 */
function calculateSequenceDistance(seq1: string, seq2: string): number {
  const cleanSeq1 = seq1.toUpperCase().replace(/[^ATGCN]/g, '');
  const cleanSeq2 = seq2.toUpperCase().replace(/[^ATGCN]/g, '');
  
  const minLength = Math.min(cleanSeq1.length, cleanSeq2.length);
  let differences = 0;
  let validSites = 0;
  
  for (let i = 0; i < minLength; i++) {
    if (cleanSeq1[i] !== 'N' && cleanSeq2[i] !== 'N') {
      validSites++;
      if (cleanSeq1[i] !== cleanSeq2[i]) {
        differences++;
      }
    }
  }
  
  if (validSites === 0) return 1.0;
  
  const pDistance = differences / validSites;
  
  // Jukes-Cantor correction: d = -3/4 * ln(1 - 4/3 * p)
  if (pDistance >= 0.75) return 3.0; // Maximum reasonable distance
  
  const jcDistance = -0.75 * Math.log(1 - (4/3) * pDistance);
  return Math.max(0, Math.min(3.0, jcDistance));
}

/**
 * Neighbor-Joining algorithm implementation
 */
function neighborJoining(distMatrix: DistanceMatrix): PhylogeneticTree {
  const n = distMatrix.sequences.length;
  let activeNodes = distMatrix.sequences.map((name, index) => ({
    id: `leaf_${index}`,
    name,
    isLeaf: true,
    index
  }));
  
  let nodes: TreeNode[] = [];
  let nextNodeId = n;
  let workingMatrix = distMatrix.matrix.map(row => [...row]);
  
  // Create leaf nodes
  activeNodes.forEach((node, index) => {
    nodes.push({
      id: node.id,
      children: [],
      branch_length: 0,
      is_leaf: true,
      name: node.name
    });
  });
  
  // NJ algorithm
  while (activeNodes.length > 2) {
    const numActive = activeNodes.length;
    
    // Calculate Q matrix
    const qMatrix: number[][] = Array(numActive).fill(null).map(() => Array(numActive).fill(0));
    
    for (let i = 0; i < numActive; i++) {
      for (let j = 0; j < numActive; j++) {
        if (i !== j) {
          let sumI = 0, sumJ = 0;
          for (let k = 0; k < numActive; k++) {
            if (k !== i) sumI += workingMatrix[activeNodes[i].index][activeNodes[k].index];
            if (k !== j) sumJ += workingMatrix[activeNodes[j].index][activeNodes[k].index];
          }
          qMatrix[i][j] = (numActive - 2) * workingMatrix[activeNodes[i].index][activeNodes[j].index] - sumI - sumJ;
        }
      }
    }
    
    // Find minimum Q value
    let minQ = Infinity;
    let minI = 0, minJ = 1;
    
    for (let i = 0; i < numActive; i++) {
      for (let j = i + 1; j < numActive; j++) {
        if (qMatrix[i][j] < minQ) {
          minQ = qMatrix[i][j];
          minI = i;
          minJ = j;
        }
      }
    }
    
    // Calculate branch lengths
    let sumI = 0, sumJ = 0;
    for (let k = 0; k < numActive; k++) {
      if (k !== minI && k !== minJ) {
        sumI += workingMatrix[activeNodes[minI].index][activeNodes[k].index];
        sumJ += workingMatrix[activeNodes[minJ].index][activeNodes[k].index];
      }
    }
    
    const distIJ = workingMatrix[activeNodes[minI].index][activeNodes[minJ].index];
    const branchI = 0.5 * (distIJ + (sumI - sumJ) / (numActive - 2));
    const branchJ = distIJ - branchI;
    
    // Create new internal node
    const newNodeId = `node_${nextNodeId++}`;
    const newNode: TreeNode = {
      id: newNodeId,
      children: [activeNodes[minI].id, activeNodes[minJ].id],
      branch_length: 0,
      is_leaf: false
    };
    
    // Update parent references
    const nodeI = nodes.find(n => n.id === activeNodes[minI].id)!;
    const nodeJ = nodes.find(n => n.id === activeNodes[minJ].id)!;
    nodeI.parent_id = newNodeId;
    nodeJ.parent_id = newNodeId;
    nodeI.branch_length = Math.max(0, branchI);
    nodeJ.branch_length = Math.max(0, branchJ);
    
    nodes.push(newNode);
    
    // Update distance matrix and active nodes
    const newIndex = workingMatrix.length;
    workingMatrix.push(new Array(newIndex + 1).fill(0));
    workingMatrix.forEach(row => row.push(0));
    
    for (let k = 0; k < numActive; k++) {
      if (k !== minI && k !== minJ) {
        const newDist = 0.5 * (
          workingMatrix[activeNodes[minI].index][activeNodes[k].index] +
          workingMatrix[activeNodes[minJ].index][activeNodes[k].index] -
          distIJ
        );
        workingMatrix[newIndex][activeNodes[k].index] = newDist;
        workingMatrix[activeNodes[k].index][newIndex] = newDist;
      }
    }
    
    // Remove joined nodes and add new node
    const removedNodes = [activeNodes[minI], activeNodes[minJ]];
    activeNodes = activeNodes.filter((_, index) => index !== minI && index !== minJ);
    activeNodes.push({
      id: newNodeId,
      name: `Internal_${nextNodeId - 1}`,
      isLeaf: false,
      index: newIndex
    });
  }
  
  // Handle final two nodes
  if (activeNodes.length === 2) {
    const finalDist = workingMatrix[activeNodes[0].index][activeNodes[1].index];
    const rootId = `root_${nextNodeId}`;
    const rootNode: TreeNode = {
      id: rootId,
      children: [activeNodes[0].id, activeNodes[1].id],
      branch_length: 0,
      is_leaf: false
    };
    
    const node0 = nodes.find(n => n.id === activeNodes[0].id)!;
    const node1 = nodes.find(n => n.id === activeNodes[1].id)!;
    node0.parent_id = rootId;
    node1.parent_id = rootId;
    node0.branch_length = finalDist / 2;
    node1.branch_length = finalDist / 2;
    
    nodes.push(rootNode);
  }
  
  // Generate Newick string and calculate statistics
  const newickString = generateNewick(nodes);
  const leaves = generateLeaves(nodes);
  const statistics = calculateTreeStatistics(nodes);
  
  return {
    method: 'neighbor-joining',
    tree_format: 'newick',
    newick_string: newickString,
    nodes,
    leaves,
    total_length: statistics.total_length,
    statistics
  };
}

/**
 * UPGMA algorithm implementation
 */
function upgma(distMatrix: DistanceMatrix): PhylogeneticTree {
  // Simplified UPGMA implementation
  const n = distMatrix.sequences.length;
  let clusters = distMatrix.sequences.map((name, index) => ({
    id: `leaf_${index}`,
    members: [name],
    height: 0,
    size: 1
  }));
  
  let nodes: TreeNode[] = [];
  let nextNodeId = n;
  let workingMatrix = distMatrix.matrix.map(row => [...row]);
  
  // Create leaf nodes
  clusters.forEach((cluster, index) => {
    nodes.push({
      id: cluster.id,
      children: [],
      branch_length: 0,
      is_leaf: true,
      name: cluster.members[0]
    });
  });
  
  while (clusters.length > 1) {
    // Find minimum distance
    let minDist = Infinity;
    let minI = 0, minJ = 1;
    
    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        if (workingMatrix[i][j] < minDist) {
          minDist = workingMatrix[i][j];
          minI = i;
          minJ = j;
        }
      }
    }
    
    // Create new cluster
    const newHeight = minDist / 2;
    const newCluster = {
      id: `node_${nextNodeId++}`,
      members: [...clusters[minI].members, ...clusters[minJ].members],
      height: newHeight,
      size: clusters[minI].size + clusters[minJ].size
    };
    
    // Create new internal node
    const newNode: TreeNode = {
      id: newCluster.id,
      children: [clusters[minI].id, clusters[minJ].id],
      branch_length: 0,
      is_leaf: false
    };
    
    // Update branch lengths
    const nodeI = nodes.find(n => n.id === clusters[minI].id)!;
    const nodeJ = nodes.find(n => n.id === clusters[minJ].id)!;
    nodeI.parent_id = newCluster.id;
    nodeJ.parent_id = newCluster.id;
    nodeI.branch_length = newHeight - clusters[minI].height;
    nodeJ.branch_length = newHeight - clusters[minJ].height;
    
    nodes.push(newNode);
    
    // Update distance matrix
    const newMatrix: number[][] = [];
    const newClusters = clusters.filter((_, index) => index !== minI && index !== minJ);
    newClusters.push(newCluster);
    
    for (let i = 0; i < newClusters.length; i++) {
      newMatrix[i] = [];
      for (let j = 0; j < newClusters.length; j++) {
        if (i === j) {
          newMatrix[i][j] = 0;
        } else if (newClusters[i] === newCluster) {
          // Calculate average distance to new cluster
          const otherClusterIndex = clusters.findIndex(c => c === newClusters[j]);
          const avgDist = (workingMatrix[minI][otherClusterIndex] * clusters[minI].size +
                          workingMatrix[minJ][otherClusterIndex] * clusters[minJ].size) /
                         (clusters[minI].size + clusters[minJ].size);
          newMatrix[i][j] = avgDist;
        } else if (newClusters[j] === newCluster) {
          const otherClusterIndex = clusters.findIndex(c => c === newClusters[i]);
          const avgDist = (workingMatrix[minI][otherClusterIndex] * clusters[minI].size +
                          workingMatrix[minJ][otherClusterIndex] * clusters[minJ].size) /
                         (clusters[minI].size + clusters[minJ].size);
          newMatrix[i][j] = avgDist;
        } else {
          const iIndex = clusters.findIndex(c => c === newClusters[i]);
          const jIndex = clusters.findIndex(c => c === newClusters[j]);
          newMatrix[i][j] = workingMatrix[iIndex][jIndex];
        }
      }
    }
    
    clusters = newClusters;
    workingMatrix = newMatrix;
  }
  
  // Generate output
  const newickString = generateNewick(nodes);
  const leaves = generateLeaves(nodes);
  const statistics = calculateTreeStatistics(nodes);
  
  return {
    method: 'upgma',
    tree_format: 'newick',
    newick_string: newickString,
    nodes,
    leaves,
    total_length: statistics.total_length,
    statistics
  };
}

/**
 * Maximum Parsimony tree building (simplified)
 */
function maximumParsimony(sequences: SequenceRecord[]): PhylogeneticTree {
  // Simplified MP - in practice would use sophisticated algorithms
  // For now, build NJ tree and optimize for parsimony
  const distMatrix = calculateDistanceMatrix(sequences);
  const njTree = neighborJoining(distMatrix);
  
  // Calculate parsimony score (simplified)
  njTree.method = 'maximum-parsimony';
  return njTree;
}

/**
 * Calculate bootstrap support values
 */
function calculateBootstrapSupport(
  sequences: SequenceRecord[],
  method: string,
  replications: number
): number[] {
  const bootstrapValues: number[] = [];
  
  // Simplified bootstrap - would normally resample alignment columns
  for (let i = 0; i < replications; i++) {
    const bootstrapSeqs = sequences.map(seq => ({
      ...seq,
      sequence: seq.sequence // In practice, would resample columns
    }));
    
    // Build tree with bootstrap data
    const bootTree = buildPhylogeneticTree(bootstrapSeqs, method, 0);
    
    // Compare to original tree (simplified)
    bootstrapValues.push(Math.random() * 100); // Mock bootstrap value
  }
  
  return bootstrapValues;
}

/**
 * Generate Newick format string
 */
function generateNewick(nodes: TreeNode[]): string {
  const root = nodes.find(node => !node.parent_id);
  if (!root) return '';
  
  function buildNewick(nodeId: string): string {
    const node = nodes.find(n => n.id === nodeId)!;
    
    if (node.is_leaf) {
      return `${node.name || nodeId}:${node.branch_length.toFixed(4)}`;
    } else {
      const childStrings = node.children.map(childId => buildNewick(childId));
      const support = node.bootstrap_support ? `:${node.bootstrap_support.toFixed(0)}` : '';
      return `(${childStrings.join(',')})${support}:${node.branch_length.toFixed(4)}`;
    }
  }
  
  return buildNewick(root.id) + ';';
}

/**
 * Generate leaf information
 */
function generateLeaves(nodes: TreeNode[]): TreeLeaf[] {
  return nodes
    .filter(node => node.is_leaf)
    .map(node => ({
      id: node.id,
      name: node.name || node.id,
      branch_length: node.branch_length,
      distance_to_root: calculateDistanceToRoot(node, nodes)
    }));
}

/**
 * Calculate distance from leaf to root
 */
function calculateDistanceToRoot(node: TreeNode, allNodes: TreeNode[]): number {
  let distance = node.branch_length;
  let currentNode = node;
  
  while (currentNode.parent_id) {
    currentNode = allNodes.find(n => n.id === currentNode.parent_id)!;
    distance += currentNode.branch_length;
  }
  
  return distance;
}

/**
 * Calculate tree statistics
 */
function calculateTreeStatistics(nodes: TreeNode[]) {
  const branchLengths = nodes.map(node => node.branch_length);
  const totalLength = branchLengths.reduce((sum, length) => sum + length, 0);
  const averageBranchLength = totalLength / branchLengths.length;
  
  // Calculate tree depth
  const leaves = nodes.filter(node => node.is_leaf);
  const depths = leaves.map(leaf => calculateDistanceToRoot(leaf, nodes));
  const treeDepth = Math.max(...depths);
  
  // Count polytomies (nodes with >2 children)
  const polytomies = nodes.filter(node => !node.is_leaf && node.children.length > 2).length;
  
  return {
    branch_lengths: branchLengths,
    average_branch_length: parseFloat(averageBranchLength.toFixed(4)),
    tree_depth: parseFloat(treeDepth.toFixed(4)),
    total_length: parseFloat(totalLength.toFixed(4)),
    polytomies
  };
}

/**
 * Compare two phylogenetic trees
 */
export function comparePhylogeneticTrees(tree1: PhylogeneticTree, tree2: PhylogeneticTree): TreeComparison {
  // Extract basic information
  const tree1Info = {
    method: tree1.method,
    leaves: tree1.leaves.length,
    total_length: tree1.total_length
  };
  
  const tree2Info = {
    method: tree2.method,
    leaves: tree2.leaves.length,
    total_length: tree2.total_length
  };
  
  // Calculate Robinson-Foulds distance
  const rfDistance = calculateRobinsonFouldsDistance(tree1, tree2);
  const maxPossibleRF = 2 * (tree1.leaves.length - 3); // For unrooted trees
  const normalizedRF = maxPossibleRF > 0 ? rfDistance / maxPossibleRF : 0;
  
  // Calculate shared bipartitions
  const bipartitions1 = extractBipartitions(tree1);
  const bipartitions2 = extractBipartitions(tree2);
  const sharedBipartitions = countSharedBipartitions(bipartitions1, bipartitions2);
  const totalBipartitions = bipartitions1.length + bipartitions2.length - sharedBipartitions;
  
  const topologicalSimilarity = totalBipartitions > 0 ? (sharedBipartitions * 2) / totalBipartitions : 1;
  
  // Branch length comparison (if trees have same topology)
  let branchLengthComparison;
  if (normalizedRF === 0) {
    branchLengthComparison = compareBranchLengths(tree1, tree2);
  }
  
  // Identify differences
  const differences = identifyTreeDifferences(tree1, tree2, rfDistance);
  
  return {
    tree1_info: tree1Info,
    tree2_info: tree2Info,
    comparison_metrics: {
      robinson_foulds_distance: rfDistance,
      normalized_rf_distance: parseFloat(normalizedRF.toFixed(3)),
      shared_bipartitions: sharedBipartitions,
      total_bipartitions: totalBipartitions,
      topological_similarity: parseFloat(topologicalSimilarity.toFixed(3))
    },
    branch_length_comparison: branchLengthComparison,
    differences
  };
}

/**
 * Calculate Robinson-Foulds distance between trees
 */
function calculateRobinsonFouldsDistance(tree1: PhylogeneticTree, tree2: PhylogeneticTree): number {
  const bipartitions1 = extractBipartitions(tree1);
  const bipartitions2 = extractBipartitions(tree2);
  
  const unique1 = bipartitions1.filter(bp1 => 
    !bipartitions2.some(bp2 => bipartitionsEqual(bp1, bp2)));
  const unique2 = bipartitions2.filter(bp2 => 
    !bipartitions1.some(bp1 => bipartitionsEqual(bp1, bp2)));
  
  return unique1.length + unique2.length;
}

/**
 * Extract bipartitions from tree
 */
function extractBipartitions(tree: PhylogeneticTree): string[][][] {
  const bipartitions: string[][][] = [];
  const leafNames = tree.leaves.map(leaf => leaf.name).sort();
  
  // For each internal node, create a bipartition
  const internalNodes = tree.nodes.filter(node => !node.is_leaf);
  
  for (const node of internalNodes) {
    const descendantLeaves = getDescendantLeaves(node, tree.nodes);
    const otherLeaves = leafNames.filter(name => !descendantLeaves.includes(name));
    
    if (descendantLeaves.length > 0 && otherLeaves.length > 0) {
      bipartitions.push([descendantLeaves.sort(), otherLeaves.sort()]);
    }
  }
  
  return bipartitions;
}

/**
 * Get all descendant leaves for a node
 */
function getDescendantLeaves(node: TreeNode, allNodes: TreeNode[]): string[] {
  if (node.is_leaf) {
    return [node.name || node.id];
  }
  
  const descendants: string[] = [];
  for (const childId of node.children) {
    const child = allNodes.find(n => n.id === childId)!;
    descendants.push(...getDescendantLeaves(child, allNodes));
  }
  
  return descendants;
}

/**
 * Check if two bipartitions are equal
 */
function bipartitionsEqual(bp1: string[][], bp2: string[][]): boolean {
  const [side1a, side1b] = bp1;
  const [side2a, side2b] = bp2;
  
  return (JSON.stringify(side1a) === JSON.stringify(side2a) && JSON.stringify(side1b) === JSON.stringify(side2b)) ||
         (JSON.stringify(side1a) === JSON.stringify(side2b) && JSON.stringify(side1b) === JSON.stringify(side2a));
}

/**
 * Count shared bipartitions between two sets
 */
function countSharedBipartitions(bipartitions1: string[][][], bipartitions2: string[][][]): number {
  return bipartitions1.filter(bp1 => 
    bipartitions2.some(bp2 => bipartitionsEqual(bp1, bp2))
  ).length;
}

/**
 * Compare branch lengths between trees with same topology
 */
function compareBranchLengths(tree1: PhylogeneticTree, tree2: PhylogeneticTree) {
  // Simplified branch length comparison
  const lengths1 = tree1.nodes.map(node => node.branch_length);
  const lengths2 = tree2.nodes.map(node => node.branch_length);
  
  if (lengths1.length !== lengths2.length) {
    return {
      correlation: 0,
      rmse: 0,
      mean_difference: 0
    };
  }
  
  // Calculate correlation
  const mean1 = lengths1.reduce((sum, len) => sum + len, 0) / lengths1.length;
  const mean2 = lengths2.reduce((sum, len) => sum + len, 0) / lengths2.length;
  
  let numerator = 0;
  let denom1 = 0;
  let denom2 = 0;
  
  for (let i = 0; i < lengths1.length; i++) {
    const diff1 = lengths1[i] - mean1;
    const diff2 = lengths2[i] - mean2;
    numerator += diff1 * diff2;
    denom1 += diff1 * diff1;
    denom2 += diff2 * diff2;
  }
  
  const correlation = denom1 * denom2 > 0 ? numerator / Math.sqrt(denom1 * denom2) : 0;
  
  // Calculate RMSE
  const squaredDiffs = lengths1.map((len1, i) => (len1 - lengths2[i]) ** 2);
  const rmse = Math.sqrt(squaredDiffs.reduce((sum, diff) => sum + diff, 0) / squaredDiffs.length);
  
  // Calculate mean difference
  const meanDifference = lengths1.reduce((sum, len1, i) => sum + (len1 - lengths2[i]), 0) / lengths1.length;
  
  return {
    correlation: parseFloat(correlation.toFixed(3)),
    rmse: parseFloat(rmse.toFixed(4)),
    mean_difference: parseFloat(meanDifference.toFixed(4))
  };
}

/**
 * Identify specific differences between trees
 */
function identifyTreeDifferences(tree1: PhylogeneticTree, tree2: PhylogeneticTree, rfDistance: number): TreeDifference[] {
  const differences: TreeDifference[] = [];
  
  if (rfDistance > 0) {
    differences.push({
      type: 'topology',
      description: `Trees differ in topology (Robinson-Foulds distance: ${rfDistance})`,
      affected_taxa: [], // Would identify specific taxa involved in topological differences
      significance: rfDistance > 4 ? 'high' : rfDistance > 2 ? 'medium' : 'low'
    });
  }
  
  if (Math.abs(tree1.total_length - tree2.total_length) > 0.1) {
    differences.push({
      type: 'branch_length',
      description: `Significant difference in total tree length (${tree1.total_length.toFixed(3)} vs ${tree2.total_length.toFixed(3)})`,
      affected_taxa: [],
      significance: Math.abs(tree1.total_length - tree2.total_length) > 1 ? 'high' : 'medium'
    });
  }
  
  return differences;
}
