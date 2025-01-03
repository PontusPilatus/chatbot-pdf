# Set environment variables before importing any ML libraries
import os
import logging

# Suppress all ML-related logs and warnings
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'  # Suppress TensorFlow logs
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'  # Disable oneDNN custom operations
os.environ['TOKENIZERS_PARALLELISM'] = 'false'  # Suppress tokenizer warnings

# Import TensorFlow compat.v1 directly
import tensorflow.compat.v1 as tf_v1

def setup_environment():
    """Configure environment variables and suppress unnecessary warnings."""
    # Use the correct TensorFlow v1 logging method
    tf_v1.logging.set_verbosity(tf_v1.logging.ERROR)
    
    # Set all loggers to ERROR level
    for logger_name in ['tensorflow', 'transformers', 'sentence_transformers', 'absl']:
        logging.getLogger(logger_name).setLevel(logging.ERROR) 