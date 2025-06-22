"""
Database initialization and migration script.
Creates all tables with proper indexes and constraints.
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import text
from datetime import datetime

# revision identifiers
revision = '001_add_authentication'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    """Create authentication and enhanced tables"""
    
    # Create users table
    op.create_table('users',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('full_name', sa.String(), nullable=False),
        sa.Column('hashed_password', sa.String(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=True, default=True),
        sa.Column('is_verified', sa.Boolean(), nullable=True, default=False),
        sa.Column('roles', sa.JSON(), nullable=True),
        sa.Column('avatar_url', sa.String(), nullable=True),
        sa.Column('bio', sa.Text(), nullable=True),
        sa.Column('preferences', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('last_login_at', sa.DateTime(), nullable=True),
        sa.Column('failed_login_attempts', sa.Integer(), nullable=True, default=0),
        sa.Column('locked_until', sa.DateTime(), nullable=True),
        sa.Column('two_factor_enabled', sa.Boolean(), nullable=True, default=False),
        sa.Column('two_factor_secret', sa.String(), nullable=True),
        sa.Column('storage_used', sa.Integer(), nullable=True, default=0),
        sa.Column('api_calls_count', sa.Integer(), nullable=True, default=0),
        sa.Column('last_api_call_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    
    # Create refresh_tokens table
    op.create_table('refresh_tokens',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('token', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('revoked', sa.Boolean(), nullable=True, default=False),
        sa.Column('revoked_at', sa.DateTime(), nullable=True),
        sa.Column('device_info', sa.JSON(), nullable=True),
        sa.Column('ip_address', sa.String(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('token')
    )
    op.create_index('idx_refresh_token_user_id', 'refresh_tokens', ['user_id'])
    op.create_index('idx_refresh_token_expires', 'refresh_tokens', ['expires_at'])
    op.create_index(op.f('ix_refresh_tokens_token'), 'refresh_tokens', ['token'], unique=True)
    
    # Create api_keys table
    op.create_table('api_keys',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('key_hash', sa.String(), nullable=False),
        sa.Column('key_prefix', sa.String(), nullable=False),
        sa.Column('scopes', sa.JSON(), nullable=True),
        sa.Column('rate_limit', sa.Integer(), nullable=True, default=1000),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('last_used_at', sa.DateTime(), nullable=True),
        sa.Column('expires_at', sa.DateTime(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True, default=True),
        sa.Column('usage_count', sa.Integer(), nullable=True, default=0),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'name')
    )
    op.create_index('idx_api_key_prefix', 'api_keys', ['key_prefix'])
    
    # Create teams table
    op.create_table('teams',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('slug', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('subscription_tier', sa.String(), nullable=True, default='free'),
        sa.Column('subscription_expires_at', sa.DateTime(), nullable=True),
        sa.Column('storage_limit', sa.Integer(), nullable=True, default=5000000000),
        sa.Column('storage_used', sa.Integer(), nullable=True, default=0),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('slug')
    )
    op.create_index(op.f('ix_teams_slug'), 'teams', ['slug'], unique=True)
    
    # Create user_teams association table
    op.create_table('user_teams',
        sa.Column('user_id', sa.String(), nullable=True),
        sa.Column('team_id', sa.String(), nullable=True),
        sa.Column('role', sa.String(), nullable=True, default='member'),
        sa.Column('joined_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['team_id'], ['teams.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], )
    )
    
    # Create audit_logs table
    op.create_table('audit_logs',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=True),
        sa.Column('action', sa.String(), nullable=False),
        sa.Column('resource_type', sa.String(), nullable=True),
        sa.Column('resource_id', sa.String(), nullable=True),
        sa.Column('ip_address', sa.String(), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.Column('request_method', sa.String(), nullable=True),
        sa.Column('request_path', sa.String(), nullable=True),
        sa.Column('details', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_audit_user_id', 'audit_logs', ['user_id'])
    op.create_index('idx_audit_action', 'audit_logs', ['action'])
    op.create_index('idx_audit_resource', 'audit_logs', ['resource_type', 'resource_id'])
    op.create_index('idx_audit_created_at', 'audit_logs', ['created_at'])
    
    # Add user_id to existing projects table
    with op.batch_alter_table('projects') as batch_op:
        batch_op.add_column(sa.Column('user_id', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('team_id', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('source_url', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('error_message', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('analysis_provider', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('analysis_model', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('analysis_settings', sa.JSON(), nullable=True))
        batch_op.add_column(sa.Column('file_path', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('file_size', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('processing_started_at', sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column('processing_completed_at', sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column('processing_time_seconds', sa.Float(), nullable=True))
        batch_op.add_column(sa.Column('analysis_cost', sa.Float(), nullable=True, default=0.0))
        batch_op.add_column(sa.Column('storage_cost', sa.Float(), nullable=True, default=0.0))
        batch_op.add_column(sa.Column('is_public', sa.Boolean(), nullable=True, default=False))
        batch_op.add_column(sa.Column('share_token', sa.String(), nullable=True))
        batch_op.create_foreign_key('fk_projects_user_id', 'users', ['user_id'], ['id'])
        batch_op.create_foreign_key('fk_projects_team_id', 'teams', ['team_id'], ['id'])
    
    op.create_index('idx_project_user_id', 'projects', ['user_id'])
    op.create_index('idx_project_team_id', 'projects', ['team_id'])
    op.create_index('idx_project_status', 'projects', ['status'])
    op.create_index('idx_project_created_at', 'projects', ['created_at'])
    op.create_index('idx_project_share_token', 'projects', ['share_token'])
    
    # Enhance clips table
    with op.batch_alter_table('clips') as batch_op:
        batch_op.add_column(sa.Column('duration', sa.Float(), nullable=True))
        batch_op.add_column(sa.Column('confidence', sa.Float(), nullable=True))
        batch_op.add_column(sa.Column('analysis_reason', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('category', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('is_exported', sa.Boolean(), nullable=True, default=False))
        batch_op.add_column(sa.Column('export_path', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('thumbnail_path', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('is_favorite', sa.Boolean(), nullable=True, default=False))
        batch_op.add_column(sa.Column('user_notes', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('view_count', sa.Integer(), nullable=True, default=0))
        batch_op.add_column(sa.Column('exported_at', sa.DateTime(), nullable=True))
    
    op.create_index('idx_clip_project_id', 'clips', ['project_id'])
    op.create_index('idx_clip_score', 'clips', ['score'])
    op.create_index('idx_clip_category', 'clips', ['category'])
    
    # Create analysis_results table
    op.create_table('analysis_results',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('project_id', sa.String(), nullable=False),
        sa.Column('provider', sa.String(), nullable=False),
        sa.Column('model', sa.String(), nullable=False),
        sa.Column('prompt', sa.Text(), nullable=False),
        sa.Column('raw_response', sa.JSON(), nullable=False),
        sa.Column('processed_clips', sa.JSON(), nullable=False),
        sa.Column('processing_time', sa.Float(), nullable=False),
        sa.Column('token_count', sa.Integer(), nullable=True),
        sa.Column('cost', sa.Float(), nullable=True),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Update settings table for user-specific settings
    with op.batch_alter_table('settings') as batch_op:
        batch_op.add_column(sa.Column('user_id', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('is_encrypted', sa.Boolean(), nullable=True, default=False))
        batch_op.add_column(sa.Column('description', sa.Text(), nullable=True))
        batch_op.create_foreign_key('fk_settings_user_id', 'users', ['user_id'], ['id'])
        batch_op.create_unique_constraint('uq_settings_user_category_key', ['user_id', 'category', 'key'])
    
    op.create_index('idx_setting_user_category', 'settings', ['user_id', 'category'])


def downgrade():
    """Drop authentication tables and revert changes"""
    
    # Drop indexes first
    op.drop_index('idx_setting_user_category', table_name='settings')
    op.drop_index('idx_clip_category', table_name='clips')
    op.drop_index('idx_clip_score', table_name='clips')
    op.drop_index('idx_clip_project_id', table_name='clips')
    op.drop_index('idx_project_share_token', table_name='projects')
    op.drop_index('idx_project_created_at', table_name='projects')
    op.drop_index('idx_project_status', table_name='projects')
    op.drop_index('idx_project_team_id', table_name='projects')
    op.drop_index('idx_project_user_id', table_name='projects')
    op.drop_index('idx_audit_created_at', table_name='audit_logs')
    op.drop_index('idx_audit_resource', table_name='audit_logs')
    op.drop_index('idx_audit_action', table_name='audit_logs')
    op.drop_index('idx_audit_user_id', table_name='audit_logs')
    op.drop_index('idx_api_key_prefix', table_name='api_keys')
    op.drop_index(op.f('ix_teams_slug'), table_name='teams')
    op.drop_index(op.f('ix_refresh_tokens_token'), table_name='refresh_tokens')
    op.drop_index('idx_refresh_token_expires', table_name='refresh_tokens')
    op.drop_index('idx_refresh_token_user_id', table_name='refresh_tokens')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    
    # Remove columns from existing tables
    with op.batch_alter_table('settings') as batch_op:
        batch_op.drop_constraint('uq_settings_user_category_key', type_='unique')
        batch_op.drop_constraint('fk_settings_user_id', type_='foreignkey')
        batch_op.drop_column('description')
        batch_op.drop_column('is_encrypted')
        batch_op.drop_column('user_id')
    
    with op.batch_alter_table('clips') as batch_op:
        batch_op.drop_column('exported_at')
        batch_op.drop_column('view_count')
        batch_op.drop_column('user_notes')
        batch_op.drop_column('is_favorite')
        batch_op.drop_column('thumbnail_path')
        batch_op.drop_column('export_path')
        batch_op.drop_column('is_exported')
        batch_op.drop_column('category')
        batch_op.drop_column('analysis_reason')
        batch_op.drop_column('confidence')
        batch_op.drop_column('duration')
    
    with op.batch_alter_table('projects') as batch_op:
        batch_op.drop_constraint('fk_projects_team_id', type_='foreignkey')
        batch_op.drop_constraint('fk_projects_user_id', type_='foreignkey')
        batch_op.drop_column('share_token')
        batch_op.drop_column('is_public')
        batch_op.drop_column('storage_cost')
        batch_op.drop_column('analysis_cost')
        batch_op.drop_column('processing_time_seconds')
        batch_op.drop_column('processing_completed_at')
        batch_op.drop_column('processing_started_at')
        batch_op.drop_column('file_size')
        batch_op.drop_column('file_path')
        batch_op.drop_column('analysis_settings')
        batch_op.drop_column('analysis_model')
        batch_op.drop_column('analysis_provider')
        batch_op.drop_column('error_message')
        batch_op.drop_column('source_url')
        batch_op.drop_column('team_id')
        batch_op.drop_column('user_id')
    
    # Drop tables
    op.drop_table('analysis_results')
    op.drop_table('audit_logs')
    op.drop_table('user_teams')
    op.drop_table('teams')
    op.drop_table('api_keys')
    op.drop_table('refresh_tokens')
    op.drop_table('users')
