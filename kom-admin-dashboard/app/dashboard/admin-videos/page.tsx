"use client";

import { useEffect, useState } from "react";
import { AdminVideo, AdminVideosService } from "../../../lib/services/admin-videos";
import { Loader } from "../../../components/ui/loader";
import { Button } from "../../../components/ui/button";
import { useToast } from "../../../components/ui/toast";
import { Card } from "../../../components/ui/card";
import { Trash2, Eye } from "lucide-react";
import { Modal } from "../../../components/ui/modal";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";

export default function AdminVideosPage() {
  const [videos, setVideos] = useState<AdminVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Form State
  const [uploading, setUploading] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { pushToast } = useToast();

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const data = await AdminVideosService.getAll();
      setVideos(data || []);
    } catch (err) {
      console.error(err);
      pushToast({ message: "فشل تحميل الفيديوهات", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleDelete = async (id: string) => {
    if(!confirm("هل أنت متأكد من حذف هذا الفيديو؟")) return;
    try {
      await AdminVideosService.delete(id);
      setVideos(prev => prev.filter(v => v.id !== id));
      pushToast({ message: "تم حذف الفيديو", type: "success" });
    } catch (e) {
      console.error(e);
      pushToast({ message: "فشل حذف الفيديو", type: "error" });
    }
  };

  const handleCreate = async () => {
    if (!selectedFile) {
        pushToast({ message: "يرجى اختيار ملف فيديو", type: "error" });
        return;
    }
    
    setUploading(true);
    try {
        const newVideo = await AdminVideosService.create(selectedFile, newTitle, newDesc);
        setVideos([newVideo, ...videos]);
        pushToast({ message: "تم رفع الفيديو بنجاح", type: "success" });
        setShowAddModal(false);
        // Reset form
        setSelectedFile(null);
        setNewTitle("");
        setNewDesc("");
    } catch (e) {
        console.error(e);
        pushToast({ message: "فشل رفع الفيديو", type: "error" });
    } finally {
        setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-black/60">
        <Loader />
        جاري تحميل الفيديوهات...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold bg-white/80 p-2 rounded">مكتبة فيديوهات المسؤول</h1>
        <Button onClick={() => setShowAddModal(true)} className="bg-primary hover:bg-primary/90">
             إضافة فيديو جديد
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map(video => (
              <Card key={video.id} className="overflow-hidden border-none shadow-sm flex flex-col">
                  <div className="relative aspect-video bg-black group">
                      {/* Using thumbnail if available, else video */}
                       <video 
                          src={video.videoUrl} 
                          poster={video.thumbnailUrl}
                          controls 
                          className="w-full h-full object-cover" 
                       />
                       <div className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded text-white text-xs flex items-center gap-1">
                           <Eye size={12} /> {video.viewsCount}
                       </div>
                  </div>
                  <div className="p-4 bg-white flex-1 flex flex-col gap-2">
                       <h3 className="font-bold text-lg line-clamp-1">{video.title || "بدون عنوان"}</h3>
                       <p className="text-gray-500 text-sm line-clamp-2 flex-1">{video.description || "لا يوجد وصف"}</p>
                       <div className="flex justify-between items-center mt-3 pt-3 border-t">
                            <span className="text-xs text-gray-400 dir-rtl font-mono">
                                {new Date(video.createdAt).toLocaleDateString('en-GB')}
                            </span>
                            <Button variant="destructive" size="sm" onClick={() => handleDelete(video.id)}>
                                <Trash2 size={16} />
                            </Button>
                       </div>
                  </div>
              </Card>
          ))}
          
          {videos.length === 0 && (
              <div className="col-span-full py-20 text-center text-gray-400 border-2 border-dashed rounded-lg">
                  لا توجد فيديوهات مضافة حالياً
              </div>
          )}
      </div>

      <Modal
        open={showAddModal}
        onClose={() => !uploading && setShowAddModal(false)}
        title="إضافة فيديو جديد"
      >
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium mb-1">عنوان الفيديو</label>
                <Input 
                    value={newTitle} 
                    onChange={e => setNewTitle(e.target.value)} 
                    placeholder="عنوان الفيديو (اختياري)" 
                />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">الوصف</label>
                <Textarea 
                    value={newDesc} 
                    onChange={e => setNewDesc(e.target.value)} 
                    placeholder="وصف الفيديو (اختياري)"
                    rows={3} 
                />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">ملف الفيديو</label>
                <input 
                    type="file" 
                    accept="video/*"
                    onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-slate-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-violet-50 file:text-violet-700
                      hover:file:bg-violet-100
                    "
                />
                <p className="text-xs text-gray-500 mt-1">يجب أن يكون ملف فيديو (MP4, MOV, etc). الحد الأقصى 100 ميجابايت.</p>
            </div>

            <div className="flex justify-end gap-2 mt-6">
                <Button variant="ghost" onClick={() => setShowAddModal(false)} disabled={uploading}>إلغاء</Button>
                <Button onClick={handleCreate} disabled={uploading || !selectedFile}>
                    {uploading ? 'جاري الرفع...' : 'رفع الفيديو'}
                </Button>
            </div>
        </div>
      </Modal>
    </div>
  );
}
