import numpy as np
import json
from sklearn.metrics.pairwise import cosine_similarity
from collections import Counter
import re

class SemanticCoverageEngine:
    def __init__(self, embedder=None):
        self.embedder = embedder # Placeholder for Vertex/Gemini embedder
        
    def extract_entities(self, text: str):
        """
        MVP NLP extraction: Simple word frequency minus stop words.
        In production, this would use spaCy or an LLM NER pass.
        """
        words = re.findall(r'\b[a-zA-Z]{4,}\b', text.lower())
        return dict(Counter(words))
        
    def calculate_coverage(self, serp_entities: list, draft_content: str, draft_vector: list, serp_centroid_vector: list) -> float:
        """
        Calculates semantic coverage score [0, 1] based on mathematical models
        combining Cosine Similarity and precise Entity Matching.
        """
        try:
            # 1. Cosine Similarity Base Score against SERP Centroid
            if draft_vector and serp_centroid_vector:
                cos_sim = cosine_similarity(
                    np.array(draft_vector).reshape(1, -1),
                    np.array(serp_centroid_vector).reshape(1, -1)
                )[0][0]
                base_score = float(max(0, cos_sim))
            else:
                base_score = 0.5
                
            # 2. Entity Extraction & Frequency Mapping
            draft_entities = self.extract_entities(draft_content)
            
            # 3. Penalties calculation
            penalty_missing = 0.0
            penalty_over_opt = 0.0
            
            covered_critical = 0
            total_critical = 0
            
            for ent in serp_entities:
                freq_in_draft = draft_entities.get(ent.get('name', '').lower(), 0)
                expected_freq = ent.get('frequency', 1.0)
                
                if ent.get('salience', 0.0) > 0.5: # Consider critical if highly salient
                    total_critical += 1
                    if freq_in_draft == 0:
                        penalty_missing += 0.05 # 5% penalty per missing critical entity
                    else:
                        covered_critical += 1
                        
                # Over-optimization (keyword stuffing check)
                if expected_freq > 0 and freq_in_draft > expected_freq * 3:
                    penalty_over_opt += 0.02
                    
            # 4. Final Score formulation
            entity_coverage_ratio = covered_critical / total_critical if total_critical > 0 else 1.0
            
            # Weighted Model: 60% semantic similarity + 40% precise entity match list - penalties
            final_score = (base_score * 0.6) + (entity_coverage_ratio * 0.4)
            final_score = final_score - penalty_missing - penalty_over_opt
            
            # Normalize to [0,1]
            return float(max(0.0, min(1.0, final_score)))
            
        except Exception as e:
            from loguru import logger
            logger.error(f"SemanticCoverageEngine error: {e}")
            return 0.0
