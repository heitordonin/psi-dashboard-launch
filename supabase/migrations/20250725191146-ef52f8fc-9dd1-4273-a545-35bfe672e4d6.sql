-- Clean up the cancelled subscription for the user experiencing the issue
-- This will allow the sync function to work properly
DELETE FROM user_subscriptions 
WHERE user_id = '4f889676-feb2-482a-81ff-b10cf0e01ffa' 
  AND status = 'cancelled';