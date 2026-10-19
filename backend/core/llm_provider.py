"""
LLM provider with support for local and API-based models
Generates answers using retrieved context
"""

import os
from typing import Optional
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
import torch


class LLMProvider:
    """Unified interface for different LLM providers"""
    
    def __init__(self, provider: str = "local", model_name: Optional[str] = None):
        """
        Initialize LLM provider
        
        Args:
            provider: "local", "openai", or "anthropic"
            model_name: Specific model to use (optional)
        """
        self.provider = provider.lower()
        self.model_name = model_name or self._get_default_model()
        
        if self.provider == "local":
            self._init_local_model()
        elif self.provider == "openai":
            self._init_openai()
        elif self.provider == "anthropic":
            self._init_anthropic()
        else:
            raise ValueError(f"Unknown provider: {provider}")
        
        print(f"LLM Provider initialized: {self.provider} ({self.model_name})")
    
    def _get_default_model(self) -> str:
        """Get default model for provider"""
        defaults = {
            "local": os.getenv("LLM_MODEL_NAME", "gpt2"),
            "openai": "gpt-3.5-turbo",
            "anthropic": "claude-3-haiku-20240307",
        }
        return defaults.get(self.provider, "gpt2")
    
    def _init_local_model(self):
        """Initialize local HuggingFace model"""
        print(f"⚙️  Local model mode: {self.model_name}")
        print("⚠️  Note: Local models require large downloads and processing power.")
        print("⚠️  For this demo, using rule-based responses instead.")
        print("💡 To use real LLM: Add OPENAI_API_KEY or ANTHROPIC_API_KEY to .env file")
        
        # Skip model loading to avoid issues - use smart demo mode
        self.model = None
        self.tokenizer = None
        self.pipe = None
        
        print("✅ Demo mode ready (context-aware responses enabled)")
    
    def _init_openai(self):
        """Initialize OpenAI client"""
        try:
            from openai import OpenAI
            api_key = os.getenv("OPENAI_API_KEY")
            if not api_key:
                raise ValueError("OPENAI_API_KEY not found in environment")
            self.client = OpenAI(api_key=api_key)
        except ImportError:
            raise ImportError("Install openai package: pip install openai")
    
    def _init_anthropic(self):
        """Initialize Anthropic client"""
        try:
            from anthropic import Anthropic
            api_key = os.getenv("ANTHROPIC_API_KEY")
            if not api_key:
                raise ValueError("ANTHROPIC_API_KEY not found in environment")
            self.client = Anthropic(api_key=api_key)
        except ImportError:
            raise ImportError("Install anthropic package: pip install anthropic")
    
    def generate(
        self,
        query: str,
        context: str,
        system_prompt: Optional[str] = None
    ) -> str:
        """
        Generate answer using query and context
        
        Args:
            query: User question
            context: Retrieved context passages
            system_prompt: Optional system instructions
            
        Returns:
            Generated answer
        """
        # Build prompt
        default_system = (
            "You are a helpful assistant. Answer the question using ONLY the provided context. "
            "If the context doesn't contain enough information, say so. "
            "Cite sources using [Source N] notation."
        )
        
        system = system_prompt or default_system
        
        prompt = f"""{system}

Context:
{context}

Question: {query}

Answer:"""
        
        # Generate based on provider
        if self.provider == "local":
            return self._generate_local(prompt)
        elif self.provider == "openai":
            return self._generate_openai(prompt, system)
        elif self.provider == "anthropic":
            return self._generate_anthropic(prompt, system)
        else:
            raise ValueError(f"Unknown provider: {self.provider}")
    
    def _generate_local(self, prompt: str) -> str:
        """Generate using local model (demo mode with smart responses)"""
        # Smart demo mode - analyze context and generate helpful response
        if self.pipe is None:
            # Extract context from prompt
            context_start = prompt.find("Context:")
            question_start = prompt.find("Question:")
            answer_start = prompt.find("Answer:")
            
            if context_start != -1 and question_start != -1:
                context = prompt[context_start+8:question_start].strip()
                question = prompt[question_start+9:answer_start if answer_start != -1 else len(prompt)].strip()
                
                # Build intelligent response based on retrieved context
                if context and len(context) > 20:
                    # Context was retrieved - create summary
                    sources = context.split("[Source")
                    num_sources = len([s for s in sources if s.strip()]) - 1
                    
                    response = f"Based on the retrieved context, "
                    
                    # Extract first meaningful chunk
                    first_chunk = context.split("[Source 1]")[-1].split("[Source 2]")[0].strip() if len(sources) > 1 else context[:200]
                    
                    if first_chunk:
                        response += f"I found {num_sources} relevant passage(s). {first_chunk[:150]}..."
                    else:
                        response += f"I found {num_sources} relevant passage(s) related to your query."
                    
                    response += f"\n\n💡 Demo Mode: Using context-aware responses. For full LLM generation with better answers, please add an OPENAI_API_KEY or ANTHROPIC_API_KEY to the .env file."
                    
                    return response
                else:
                    return (
                        "I don't have enough retrieved context to answer this question accurately. "
                        "Please make sure documents are uploaded, chunked, and indexed before querying.\n\n"
                        "💡 Demo Mode: For full LLM capabilities, add OPENAI_API_KEY or ANTHROPIC_API_KEY to .env"
                    )
            
            return (
                "Demo mode active. The retrieval system is working, but answer generation "
                "requires a configured LLM. Add OPENAI_API_KEY or ANTHROPIC_API_KEY to .env for full functionality."
            )
        
        # If model actually loaded (unlikely in this version)
        try:
            result = self.pipe(
                prompt,
                max_new_tokens=256,
                num_return_sequences=1,
                pad_token_id=self.tokenizer.eos_token_id,
            )
            
            generated_text = result[0]["generated_text"]
            
            # Extract only the answer part (after "Answer:")
            if "Answer:" in generated_text:
                answer = generated_text.split("Answer:")[-1].strip()
            else:
                answer = generated_text[len(prompt):].strip()
            
            return answer if answer else "I cannot generate an answer based on the provided context."
            
        except Exception as e:
            print(f"Generation error: {e}")
            return f"Error generating answer: {str(e)}"
    
    def _generate_openai(self, prompt: str, system: str) -> str:
        """Generate using OpenAI API"""
        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=512,
                temperature=0.7,
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            return f"OpenAI API error: {str(e)}"
    
    def _generate_anthropic(self, prompt: str, system: str) -> str:
        """Generate using Anthropic API"""
        try:
            message = self.client.messages.create(
                model=self.model_name,
                max_tokens=512,
                system=system,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            return message.content[0].text.strip()
        except Exception as e:
            return f"Anthropic API error: {str(e)}"
    
    def count_tokens(self, text: str) -> int:
        """
        Estimate token count for text
        
        Args:
            text: Input text
            
        Returns:
            Approximate token count
        """
        if self.provider == "local" and hasattr(self, "tokenizer"):
            return len(self.tokenizer.encode(text))
        else:
            # Rough estimation: ~4 chars per token
            return len(text) // 4
