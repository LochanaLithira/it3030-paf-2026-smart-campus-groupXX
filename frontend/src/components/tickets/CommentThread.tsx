import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Pencil, Trash2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { useAuthStore } from '@/store/authStore';
import { useAddComment, useUpdateComment, useDeleteComment } from '@/hooks/useTickets';
import type { TicketCommentResponse } from '@/types/api';

interface CommentThreadProps {
  ticketId: string;
  comments: TicketCommentResponse[];
}

export function CommentThread({ ticketId, comments }: CommentThreadProps) {
  const { user } = useAuthStore();
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const addComment = useAddComment();
  const updateComment = useUpdateComment();
  const deleteComment = useDeleteComment();

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    await addComment.mutateAsync({
      ticketId,
      content: newComment,
    });

    setNewComment('');
  };

  const handleEditComment = (comment: TicketCommentResponse) => {
    setEditingId(comment.commentId);
    setEditText(comment.content);
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!editText.trim()) return;

    await updateComment.mutateAsync({
      ticketId,
      commentId,
      content: editText,
    });

    setEditingId(null);
    setEditText('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    await deleteComment.mutateAsync({
      ticketId,
      commentId,
    });
  };

  const canEditComment = (comment: TicketCommentResponse) => {
    return comment.author.userId === user?.userId;
  };

  const sortedComments = [...comments].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return (
    <div className="space-y-4">
      {/* Comments List */}
      {sortedComments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <MessageSquare className="mx-auto h-12 w-12 opacity-20 mb-2" />
          <p>No comments yet. Be the first to comment!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedComments.map((comment) => (
            <Card key={comment.commentId}>
              <CardContent className="p-4">
                {/* Comment Header */}
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <div className="flex h-full w-full items-center justify-center bg-primary text-primary-foreground text-sm font-medium">
                      {comment.author.fullName.charAt(0).toUpperCase()}
                    </div>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="font-medium text-sm">
                          {comment.author.fullName}
                        </span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {formatDistanceToNow(new Date(comment.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>

                      {canEditComment(comment) && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditComment(comment)}
                            disabled={editingId !== null}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteComment(comment.commentId)}
                            disabled={deleteComment.isPending}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Comment Body */}
                    {editingId === comment.commentId ? (
                      <div className="mt-2 space-y-2">
                        <Textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="min-h-[80px]"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSaveEdit(comment.commentId)}
                            disabled={updateComment.isPending}
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEdit}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add New Comment */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-3">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[100px] resize-none"
            />
            <div className="flex justify-end">
              <Button
                onClick={handleAddComment}
                disabled={!newComment.trim() || addComment.isPending}
                size="sm"
              >
                <Send className="h-4 w-4 mr-2" />
                {addComment.isPending ? 'Posting...' : 'Post Comment'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
